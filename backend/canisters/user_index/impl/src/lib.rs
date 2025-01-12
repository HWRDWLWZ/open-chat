use crate::model::challenges::Challenges;
use crate::model::local_user_index_map::LocalUserIndex;
use crate::model::set_user_suspended_queue::SetUserSuspendedQueue;
use crate::model::storage_index_user_sync_queue::OpenStorageUserSyncQueue;
use crate::model::user_map::UserMap;
use crate::model::user_principal_migration_queue::UserPrincipalMigrationQueue;
use candid::Principal;
use canister_state_macros::canister_state;
use local_user_index_canister::{Event as LocalUserIndexEvent, Event, SuperAdminStatusChanged, UserRegistered};
use model::local_user_index_map::LocalUserIndexMap;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::{HashSet, VecDeque};
use types::{
    CanisterId, CanisterWasm, ChatId, Cryptocurrency, Cycles, Milliseconds, TimestampMillis, Timestamped, UserId, Version,
};
use utils::canister::{CanistersRequiringUpgrade, FailedUpgradeCount};
use utils::canister_event_sync_queue::CanisterEventSyncQueue;
use utils::env::Environment;
use utils::time::DAY_IN_MS;

mod guards;
mod lifecycle;
mod memory;
mod model;
mod queries;
mod updates;

pub const USER_LIMIT: usize = 100_000;

const USER_CANISTER_TOP_UP_AMOUNT: Cycles = 100_000_000_000; // 0.1T cycles
const TIME_UNTIL_SUSPENDED_ACCOUNT_IS_DELETED_MILLIS: Milliseconds = DAY_IN_MS * 90; // 90 days
const ONE_MB: u64 = 1024 * 1024;
const ONE_GB: u64 = 1024 * ONE_MB;

thread_local! {
    static WASM_VERSION: RefCell<Timestamped<Version>> = RefCell::default();
}

canister_state!(RuntimeState);

struct RuntimeState {
    pub env: Box<dyn Environment>,
    pub data: Data,
}

impl RuntimeState {
    pub fn new(env: Box<dyn Environment>, data: Data) -> RuntimeState {
        RuntimeState { env, data }
    }

    /// Traps if the caller is not an OpenChat user or an OpenChat user's canister
    pub fn trap_if_caller_not_open_chat_user(&self) {
        let caller = self.env.caller();

        if !self.data.users.is_valid_caller(caller) {
            #[cfg(not(test))]
            ic_cdk::trap("Not authorized");
        }
    }

    pub fn is_caller_governance_principal(&self) -> bool {
        let caller = self.env.caller();
        self.data.governance_principals.contains(&caller)
    }

    pub fn is_caller_local_user_index_canister(&self) -> bool {
        let caller = self.env.caller();
        self.data.local_index_map.get(&caller).is_some()
    }

    pub fn is_caller_group_index_canister(&self) -> bool {
        let caller = self.env.caller();
        caller == self.data.group_index_canister_id
    }

    pub fn is_caller_super_admin(&self) -> bool {
        let caller = self.env.caller();
        if let Some(user) = self.data.users.get_by_principal(&caller) {
            self.data.super_admins.contains(&user.user_id)
        } else {
            false
        }
    }

    pub fn metrics(&self) -> Metrics {
        let now = self.env.now();
        let canister_upgrades_metrics = self.data.canisters_requiring_upgrade.metrics();
        Metrics {
            memory_used: utils::memory::used(),
            now: self.env.now(),
            cycles_balance: self.env.cycles_balance(),
            wasm_version: WASM_VERSION.with(|v| **v.borrow()),
            git_commit_id: utils::git::git_commit_id().to_string(),
            total_cycles_spent_on_canisters: self.data.total_cycles_spent_on_canisters,
            users_created: self.data.users.len() as u64,
            diamond_users: self.data.users.diamond_metrics(now),
            canister_upgrades_completed: canister_upgrades_metrics.completed,
            canister_upgrades_failed: canister_upgrades_metrics.failed,
            canister_upgrades_pending: canister_upgrades_metrics.pending as u64,
            canister_upgrades_in_progress: canister_upgrades_metrics.in_progress as u64,
            governance_principals: self.data.governance_principals.iter().copied().collect(),
            user_wasm_version: self.data.user_canister_wasm.version,
            local_user_index_wasm_version: self.data.local_user_index_canister_wasm_for_new_canisters.version,
            max_concurrent_canister_upgrades: self.data.max_concurrent_canister_upgrades,
            super_admins: self.data.super_admins.len() as u8,
            super_admins_to_dismiss: self.data.super_admins_to_dismiss.len() as u32,
            inflight_challenges: self.data.challenges.count(),
            user_index_events_queue_length: self.data.user_index_event_sync_queue.len(),
            local_user_indexes: self.data.local_index_map.iter().map(|(c, i)| (*c, i.clone())).collect(),
            canister_ids: CanisterIds {
                group_index: self.data.group_index_canister_id,
                notifications_index: self.data.notifications_index_canister_id,
                cycles_dispenser: self.data.cycles_dispenser_canister_id,
            },
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Data {
    pub users: UserMap,
    #[serde(alias = "service_principals")]
    pub governance_principals: HashSet<Principal>,
    pub user_canister_wasm: CanisterWasm,
    #[serde(alias = "local_user_index_canister_wasm")]
    pub local_user_index_canister_wasm_for_new_canisters: CanisterWasm,
    #[serde(default)]
    pub local_user_index_canister_wasm_for_upgrades: CanisterWasm,
    pub group_index_canister_id: CanisterId,
    pub notifications_index_canister_id: CanisterId,
    pub canisters_requiring_upgrade: CanistersRequiringUpgrade,
    pub total_cycles_spent_on_canisters: Cycles,
    pub cycles_dispenser_canister_id: CanisterId,
    #[serde(alias = "open_storage_index_canister_id")]
    pub storage_index_canister_id: CanisterId,
    #[serde(alias = "open_storage_user_sync_queue")]
    pub storage_index_user_sync_queue: OpenStorageUserSyncQueue,
    pub user_index_event_sync_queue: CanisterEventSyncQueue<LocalUserIndexEvent>,
    pub user_principal_migration_queue: UserPrincipalMigrationQueue,
    pub super_admins: HashSet<UserId>,
    pub super_admins_to_dismiss: VecDeque<(UserId, ChatId)>,
    pub test_mode: bool,
    pub challenges: Challenges,
    pub max_concurrent_canister_upgrades: usize,
    pub set_user_suspended_queue: SetUserSuspendedQueue,
    pub local_index_map: LocalUserIndexMap,
}

impl Data {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        governance_principals: Vec<Principal>,
        user_canister_wasm: CanisterWasm,
        local_user_index_canister_wasm: CanisterWasm,
        group_index_canister_id: CanisterId,
        notifications_index_canister_id: CanisterId,
        cycles_dispenser_canister_id: CanisterId,
        storage_index_canister_id: CanisterId,
        proposals_bot_user_id: UserId,
        local_group_index_canister_ids: Vec<CanisterId>,
        test_mode: bool,
        now: TimestampMillis,
    ) -> Self {
        let mut data = Data {
            users: UserMap::default(),
            governance_principals: governance_principals.into_iter().collect(),
            user_canister_wasm,
            local_user_index_canister_wasm_for_new_canisters: local_user_index_canister_wasm.clone(),
            local_user_index_canister_wasm_for_upgrades: local_user_index_canister_wasm,
            group_index_canister_id,
            notifications_index_canister_id,
            cycles_dispenser_canister_id,
            canisters_requiring_upgrade: CanistersRequiringUpgrade::default(),
            total_cycles_spent_on_canisters: 0,
            storage_index_canister_id,
            storage_index_user_sync_queue: OpenStorageUserSyncQueue::default(),
            user_index_event_sync_queue: CanisterEventSyncQueue::default(),
            user_principal_migration_queue: UserPrincipalMigrationQueue::default(),
            super_admins: HashSet::new(),
            super_admins_to_dismiss: VecDeque::new(),
            test_mode,
            challenges: Challenges::new(test_mode),
            max_concurrent_canister_upgrades: 2,
            set_user_suspended_queue: SetUserSuspendedQueue::default(),
            local_index_map: LocalUserIndexMap::default(),
        };

        // Register the ProposalsBot
        data.users.register(
            proposals_bot_user_id.into(),
            proposals_bot_user_id,
            Version::default(),
            "ProposalsBot".to_string(),
            0,
            None,
            true,
        );

        for (index, canister_id) in local_group_index_canister_ids.into_iter().enumerate() {
            let username = format!("GroupUpgradeBot{}", index + 1);
            data.register_super_admin_bot(canister_id, username, now);
        }

        data
    }

    pub fn push_event_to_local_user_index(&mut self, user_id: UserId, event: LocalUserIndexEvent) {
        if let Some(canister_id) = self.local_index_map.get_index_canister(&user_id) {
            self.user_index_event_sync_queue.push(canister_id, event);
        }
    }

    pub fn push_event_to_all_local_user_indexes(&mut self, event: LocalUserIndexEvent, except: Option<CanisterId>) {
        for canister_id in self.local_index_map.canisters() {
            if except.map_or(true, |id| id != *canister_id) {
                self.user_index_event_sync_queue.push(*canister_id, event.clone());
            }
        }
    }

    fn register_super_admin_bot(&mut self, canister_id: CanisterId, username: String, now: TimestampMillis) {
        let user_id = canister_id.into();
        self.users
            .register(canister_id, user_id, Version::default(), username.clone(), now, None, true);

        self.super_admins.insert(user_id);

        self.push_event_to_all_local_user_indexes(
            Event::UserRegistered(UserRegistered {
                user_id,
                user_principal: canister_id,
                username,
                is_bot: true,
                referred_by: None,
            }),
            None,
        );

        self.push_event_to_all_local_user_indexes(
            Event::SuperAdminStatusChanged(SuperAdminStatusChanged {
                user_id,
                is_super_admin: true,
            }),
            None,
        );
    }
}

#[cfg(test)]
impl Default for Data {
    fn default() -> Data {
        Data {
            users: UserMap::default(),
            governance_principals: HashSet::new(),
            user_canister_wasm: CanisterWasm::default(),
            local_user_index_canister_wasm_for_new_canisters: CanisterWasm::default(),
            local_user_index_canister_wasm_for_upgrades: CanisterWasm::default(),
            group_index_canister_id: Principal::anonymous(),
            notifications_index_canister_id: Principal::anonymous(),
            canisters_requiring_upgrade: CanistersRequiringUpgrade::default(),
            cycles_dispenser_canister_id: Principal::anonymous(),
            total_cycles_spent_on_canisters: 0,
            storage_index_canister_id: Principal::anonymous(),
            storage_index_user_sync_queue: OpenStorageUserSyncQueue::default(),
            user_index_event_sync_queue: CanisterEventSyncQueue::default(),
            user_principal_migration_queue: UserPrincipalMigrationQueue::default(),
            super_admins: HashSet::new(),
            super_admins_to_dismiss: VecDeque::new(),
            test_mode: true,
            challenges: Challenges::new(true),
            max_concurrent_canister_upgrades: 2,
            set_user_suspended_queue: SetUserSuspendedQueue::default(),
            local_index_map: LocalUserIndexMap::default(),
        }
    }
}

#[derive(Serialize, Debug)]
pub struct Metrics {
    pub memory_used: u64,
    pub now: TimestampMillis,
    pub cycles_balance: Cycles,
    pub wasm_version: Version,
    pub git_commit_id: String,
    pub total_cycles_spent_on_canisters: Cycles,
    pub users_created: u64,
    pub diamond_users: DiamondMetrics,
    pub canister_upgrades_completed: u64,
    pub canister_upgrades_failed: Vec<FailedUpgradeCount>,
    pub canister_upgrades_pending: u64,
    pub canister_upgrades_in_progress: u64,
    pub governance_principals: Vec<Principal>,
    pub user_wasm_version: Version,
    pub local_user_index_wasm_version: Version,
    pub max_concurrent_canister_upgrades: usize,
    pub super_admins: u8,
    pub super_admins_to_dismiss: u32,
    pub inflight_challenges: u32,
    pub user_index_events_queue_length: usize,
    pub local_user_indexes: Vec<(CanisterId, LocalUserIndex)>,
    pub canister_ids: CanisterIds,
}

#[derive(Serialize, Debug, Default)]
pub struct DiamondMetrics {
    pub total: u64,
    pub recurring: u64,
    pub amount_raised: Vec<(Cryptocurrency, u128)>,
}

#[derive(Serialize, Debug)]
pub struct CanisterIds {
    pub group_index: CanisterId,
    pub notifications_index: CanisterId,
    pub cycles_dispenser: CanisterId,
}
