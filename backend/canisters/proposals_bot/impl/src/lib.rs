use crate::model::nervous_systems::NervousSystems;
use candid::{CandidType, Principal};
use canister_state_macros::canister_state;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashSet;
use types::{CanisterId, ChatId, Cycles, ProposalId, TimestampMillis, Timestamped, Version};
use utils::env::Environment;
use utils::memory;

mod governance_clients;
mod guards;
mod lifecycle;
mod model;
mod queries;
mod updates;

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

    pub fn is_caller_service_owner(&self) -> bool {
        let caller = self.env.caller();
        self.data.service_owner_principals.contains(&caller)
    }

    pub fn metrics(&self) -> Metrics {
        Metrics {
            memory_used: memory::used(),
            now: self.env.now(),
            cycles_balance: self.env.cycles_balance(),
            wasm_version: WASM_VERSION.with(|v| **v.borrow()),
            git_commit_id: utils::git::git_commit_id().to_string(),
            nervous_systems: self.data.nervous_systems.metrics(),
            service_principals: self.data.service_owner_principals.iter().copied().collect(),
            canister_ids: CanisterIds {
                user_index: self.data.user_index_canister_id,
                group_index: self.data.group_index_canister_id,
                cycles_dispenser: self.data.cycles_dispenser_canister_id,
                nns_governance: self.data.nns_governance_canister_id,
            },
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Data {
    pub nervous_systems: NervousSystems,
    pub service_owner_principals: HashSet<Principal>,
    pub user_index_canister_id: CanisterId,
    pub group_index_canister_id: CanisterId,
    pub cycles_dispenser_canister_id: CanisterId,
    pub nns_governance_canister_id: CanisterId,
    pub test_mode: bool,
}

impl Data {
    pub fn new(
        service_owner_principals: HashSet<Principal>,
        user_index_canister_id: CanisterId,
        group_index_canister_id: CanisterId,
        cycles_dispenser_canister_id: CanisterId,
        nns_governance_canister_id: CanisterId,
        test_mode: bool,
    ) -> Data {
        Data {
            nervous_systems: NervousSystems::default(),
            service_owner_principals,
            user_index_canister_id,
            group_index_canister_id,
            cycles_dispenser_canister_id,
            nns_governance_canister_id,
            test_mode,
        }
    }
}

#[derive(Serialize, Debug)]
pub struct Metrics {
    pub now: TimestampMillis,
    pub memory_used: u64,
    pub cycles_balance: Cycles,
    pub wasm_version: Version,
    pub git_commit_id: String,
    pub nervous_systems: Vec<NervousSystemMetrics>,
    pub service_principals: Vec<Principal>,
    pub canister_ids: CanisterIds,
}

#[derive(CandidType, Serialize, Debug)]
pub struct NervousSystemMetrics {
    pub name: String,
    pub governance_canister_id: CanisterId,
    pub chat_id: ChatId,
    pub latest_successful_sync: Option<TimestampMillis>,
    pub latest_failed_sync: Option<TimestampMillis>,
    pub latest_successful_proposals_update: Option<TimestampMillis>,
    pub latest_failed_proposals_update: Option<TimestampMillis>,
    pub queued_proposals: Vec<ProposalId>,
    pub active_proposals: Vec<ProposalId>,
}

#[derive(Serialize, Debug)]
pub struct CanisterIds {
    pub user_index: CanisterId,
    pub group_index: CanisterId,
    pub cycles_dispenser: CanisterId,
    pub nns_governance: CanisterId,
}
