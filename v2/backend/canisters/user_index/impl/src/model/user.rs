use candid::Principal;
use phonenumber::PhoneNumber;
use types::{CanisterCreationStatus, PartialUserSummary, TimestampMillis, UserId, UserSummary, Version};

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum User {
    Unconfirmed(UnconfirmedUser),
    Confirmed(ConfirmedUser),
    Created(CreatedUser),
}

impl User {
    pub fn get_principal(&self) -> Principal {
        match self {
            User::Unconfirmed(u) => u.principal,
            User::Confirmed(u) => u.principal,
            User::Created(u) => u.principal,
        }
    }

    pub fn get_phone_number(&self) -> &PhoneNumber {
        match self {
            User::Unconfirmed(u) => &u.phone_number,
            User::Confirmed(u) => &u.phone_number,
            User::Created(u) => &u.phone_number,
        }
    }

    pub fn get_username(&self) -> Option<&str> {
        match self {
            User::Unconfirmed(_) => None,
            User::Confirmed(u) => u.username.as_deref(),
            User::Created(u) => Some(&u.username),
        }
    }

    pub fn get_user_id(&self) -> Option<UserId> {
        match self {
            User::Unconfirmed(_) => None,
            User::Confirmed(u) => u.user_id,
            User::Created(u) => Some(u.user_id),
        }
    }

    pub fn created_user(&self) -> Option<&CreatedUser> {
        match self {
            User::Created(u) => Some(u),
            _ => None,
        }
    }

    #[allow(dead_code)]
    pub fn set_phone_number(&mut self, phone_number: PhoneNumber, now: TimestampMillis) {
        match self {
            User::Unconfirmed(u) => u.phone_number = phone_number,
            User::Confirmed(u) => u.phone_number = phone_number,
            User::Created(u) => {
                u.phone_number = phone_number;
                u.date_updated = now;
            }
        }
    }

    pub fn set_username(&mut self, username: String, now: TimestampMillis) -> bool {
        match self {
            User::Unconfirmed(_) => return false,
            User::Confirmed(u) => u.username = Some(username),
            User::Created(u) => {
                u.username = username;
                u.date_updated = now;
            }
        }
        true
    }

    pub fn set_canister_creation_status(&mut self, canister_creation_status: CanisterCreationStatus) -> bool {
        match self {
            User::Confirmed(u) => u.canister_creation_status = canister_creation_status,
            _ => return false,
        }
        true
    }

    pub fn set_canister_upgrade_status(&mut self, upgrade_in_progress: bool, new_version: Option<Version>) -> bool {
        match self {
            User::Created(u) => {
                u.upgrade_in_progress = upgrade_in_progress;
                if let Some(version) = new_version {
                    u.wasm_version = version;
                }
            }
            _ => return false,
        }
        true
    }

    pub fn set_user_id(&mut self, user_id: UserId) -> bool {
        match self {
            User::Confirmed(u) => u.user_id = Some(user_id),
            _ => return false,
        }
        true
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UnconfirmedUser {
    pub principal: Principal,
    pub phone_number: PhoneNumber,
    pub confirmation_code: String,
    pub date_generated: TimestampMillis,
    pub sms_messages_sent: u16,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConfirmedUser {
    pub principal: Principal,
    pub phone_number: PhoneNumber,
    pub user_id: Option<UserId>,
    pub username: Option<String>,
    pub canister_creation_status: CanisterCreationStatus,
    pub date_confirmed: TimestampMillis,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreatedUser {
    pub principal: Principal,
    pub phone_number: PhoneNumber,
    pub user_id: UserId,
    pub username: String,
    pub date_created: TimestampMillis,
    pub date_updated: TimestampMillis,
    pub last_online: TimestampMillis,
    pub wasm_version: Version,
    pub upgrade_in_progress: bool,
}

impl CreatedUser {
    pub fn to_summary(&self, now: TimestampMillis) -> UserSummary {
        let millis_since_last_online = now - self.last_online;
        let seconds_since_last_online = (millis_since_last_online / 1000) as u32;

        UserSummary {
            user_id: self.user_id,
            username: self.username.clone(),
            seconds_since_last_online,
        }
    }

    pub fn to_partial_summary(&self, include_username: bool, now: TimestampMillis) -> PartialUserSummary {
        let millis_since_last_online = now - self.last_online;
        let seconds_since_last_online = (millis_since_last_online / 1000) as u32;

        PartialUserSummary {
            user_id: self.user_id,
            username: if include_username { Some(self.username.clone()) } else { None },
            seconds_since_last_online,
        }
    }
}