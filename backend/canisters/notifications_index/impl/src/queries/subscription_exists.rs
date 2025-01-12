use crate::{read_state, RuntimeState};
use ic_cdk_macros::query;
use notifications_index_canister::subscription_exists::{Response::*, *};

#[query]
fn subscription_exists(args: Args) -> Response {
    read_state(|state| subscription_exists_impl(args, state))
}

fn subscription_exists_impl(args: Args, runtime_state: &RuntimeState) -> Response {
    let caller = runtime_state.env.caller();
    if let Some(user_id) = runtime_state.data.principal_to_user_id.get(&caller) {
        match runtime_state.data.subscriptions.exists(user_id, args.p256dh_key) {
            true => Yes,
            false => No,
        }
    } else {
        No
    }
}
