use candid::CandidType;
use serde::{Deserialize, Serialize};
use types::GroupCanisterGroupChatSummary;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Args {}

// Allow the large size difference because essentially all responses are the large variant anyway
#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum Response {
    Success(SuccessResult),
    CallerNotInGroup,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SuccessResult {
    pub summary: GroupCanisterGroupChatSummary,
}
