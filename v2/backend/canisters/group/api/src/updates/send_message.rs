use crate::common::reply_context_internal::ReplyContextInternal;
use candid::CandidType;
use serde::Deserialize;
use shared::time::TimestampMillis;
use shared::types::message_content::MessageContent;
use shared::types::{EventIndex, MessageId, MessageIndex};

#[derive(CandidType, Deserialize)]
pub struct Args {
    pub message_id: MessageId,
    pub content: MessageContent,
    pub sender_name: String,
    pub replies_to: Option<ReplyContextInternal>,
}

#[derive(CandidType, Deserialize)]
pub enum Response {
    Success(SuccessResult),
    NotInGroup,
}

#[derive(CandidType, Deserialize)]
pub struct SuccessResult {
    pub event_index: EventIndex,
    pub message_index: MessageIndex,
    pub timestamp: TimestampMillis,
}