use crate::guards::caller_is_user_index;
use crate::{mutate_state, run_regular_jobs, RuntimeState};
use canister_api_macros::update_msgpack;
use canister_tracing_macros::trace;
use group_canister::c2c_update_user_principal::{Response::*, *};

#[update_msgpack(guard = "caller_is_user_index")]
#[trace]
async fn c2c_update_user_principal(args: Args) -> Response {
    run_regular_jobs();

    mutate_state(|state| c2c_update_user_principal_impl(args, state))
}

fn c2c_update_user_principal_impl(args: Args, runtime_state: &mut RuntimeState) -> Response {
    if runtime_state
        .data
        .participants
        .update_user_principal(args.user_id, args.new_principal)
    {
        Success
    } else {
        UserNotFound
    }
}
