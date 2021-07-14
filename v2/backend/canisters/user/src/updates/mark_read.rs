use super::mark_read::Response::*;
use crate::canister::RUNTIME_STATE;
use crate::model::runtime_state::RuntimeState;
use candid::CandidType;
use ic_cdk_macros::update;
use serde::Deserialize;
use shared::types::chat_id::DirectChatId;
use shared::types::{MessageIndex, UserId};

#[derive(Deserialize)]
struct Args {
    user_id: UserId,
    up_to_message_index: MessageIndex,
}

#[derive(CandidType)]
enum Response {
    Success,
    SuccessNoChange,
    ChatNotFound,
    NotAuthorised,
}

#[update]
async fn mark_read(args: Args) -> Response {
    let response = RUNTIME_STATE.with(|state| mark_read_impl(&args, state.borrow_mut().as_mut().unwrap()));

    // Now call "handle_mark_read" on the recipient's canister
    if matches!(response, Response::Success) {
        let (canister_id, mark_read_c2c_args) = args.into();
        if let Err(e) = c2c::call(canister_id, mark_read_c2c_args).await {
            panic!("{}", e);
        }
    }

    response
}

fn mark_read_impl(args: &Args, runtime_state: &mut RuntimeState) -> Response {
    if runtime_state.is_caller_owner() {
        let chat_id = DirectChatId::from((&runtime_state.env.owner_user_id(), &args.user_id));
        if let Some(chat) = runtime_state.data.direct_chats.get_mut(&chat_id) {
            if chat.read_up_to < args.up_to_message_index {
                chat.read_up_to = args.up_to_message_index;
                Success
            } else {
                SuccessNoChange
            }
        } else {
            ChatNotFound
        }
    } else {
        NotAuthorised
    }
}

mod c2c {
    use super::*;
    use crate::model::runtime_state::RuntimeState;
    use shared::types::{CanisterId, MessageIndex};

    pub async fn call(canister_id: CanisterId, args: Args) -> Result<Response, String> {
        let (res,): (Response,) = ic_cdk::call(canister_id, "handle_mark_read", (args,))
            .await
            .map_err(|e| e.1)?;

        Ok(res)
    }

    #[derive(CandidType, Deserialize)]
    pub struct Args {
        up_to_message_index: MessageIndex,
    }

    #[derive(CandidType, Deserialize)]
    pub enum Response {
        Success,
        SuccessNoChange,
        ChatNotFound,
    }

    #[update]
    fn handle_mark_read(args: c2c::Args) -> c2c::Response {
        RUNTIME_STATE.with(|state| handle_mark_read_impl(args, state.borrow_mut().as_mut().unwrap()))
    }

    fn handle_mark_read_impl(args: Args, runtime_state: &mut RuntimeState) -> Response {
        let their_user_id = runtime_state.env.caller().into();

        let chat_id = DirectChatId::from((&runtime_state.env.owner_user_id(), &their_user_id));
        if let Some(chat) = runtime_state.data.direct_chats.get_mut(&chat_id) {
            if chat.read_up_to_by_them < args.up_to_message_index {
                chat.read_up_to_by_them = args.up_to_message_index;
                Response::Success
            } else {
                Response::SuccessNoChange
            }
        } else {
            Response::ChatNotFound
        }
    }

    impl From<super::Args> for (CanisterId, Args) {
        fn from(args: super::Args) -> Self {
            let c2c_args = Args {
                up_to_message_index: args.up_to_message_index,
            };

            (args.user_id.into(), c2c_args)
        }
    }
}