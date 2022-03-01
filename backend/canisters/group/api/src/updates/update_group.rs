use candid::CandidType;
use serde::Deserialize;
use types::{Avatar, FieldTooLongResult, GroupPermissions, OptionUpdate};

#[derive(CandidType, Deserialize, Debug)]
pub struct Args {
    pub name: String,
    pub description: String,
    pub avatar: OptionUpdate<Avatar>,
    pub permissions: Option<GroupPermissions>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum Response {
    Success,
    NotAuthorized,
    CallerNotInGroup,
    NameTooLong(FieldTooLongResult),
    DescriptionTooLong(FieldTooLongResult),
    AvatarTooBig(FieldTooLongResult),
    NameTaken,
    InternalError,
}