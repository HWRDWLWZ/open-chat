use crate::common::chat_summary::ChatSummary;
use candid::CandidType;
use serde::Deserialize;
use shared::time::TimestampMillis;

#[derive(CandidType, Deserialize)]
pub struct Args {
    pub updated_since: Option<TimestampMillis>,
}

#[derive(CandidType, Deserialize)]
pub enum Response {
    Success(SuccessResult),
    NotAuthorised,
}

#[derive(CandidType, Deserialize)]
pub struct SuccessResult {
    pub chats: Vec<ChatSummary>,
    pub timestamp: TimestampMillis,
}