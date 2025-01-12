use candid::CandidType;
use serde::{Deserialize, Serialize};
use types::{MessageId, ProposalDecisionStatus, ProposalRewardStatus, Tally, TimestampMillis};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Args {
    pub proposals: Vec<ProposalUpdate>,
    pub correlation_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct ProposalUpdate {
    pub message_id: MessageId,
    pub status: Option<ProposalDecisionStatus>,
    pub reward_status: Option<ProposalRewardStatus>,
    pub latest_tally: Option<Tally>,
    pub deadline: Option<TimestampMillis>,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum Response {
    Success,
    CallerNotInGroup,
}
