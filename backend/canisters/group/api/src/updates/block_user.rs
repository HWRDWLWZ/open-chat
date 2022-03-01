use candid::CandidType;
use serde::Deserialize;
use types::UserId;

#[derive(CandidType, Deserialize, Debug)]
pub struct Args {
    pub user_id: UserId,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum Response {
    Success,
    CallerNotInGroup,
    CannotBlockSelf,
    CannotBlockUser,
    GroupNotPublic,
    InternalError(String),
    NotAuthorized,
    UserNotInGroup,
}