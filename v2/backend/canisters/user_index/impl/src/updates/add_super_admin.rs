use crate::guards::caller_is_controller;
use crate::{RuntimeState, RUNTIME_STATE};
use canister_api_macros::trace;
use ic_cdk_macros::update;
use types::UserId;
use user_canister::c2c_grant_super_admin;
use user_index_canister::add_super_admin::{Response::*, *};

#[update(guard = "caller_is_controller")]
#[trace]
async fn add_super_admin(args: Args) -> Response {
    if RUNTIME_STATE.with(|state| is_already_super_admin(&args.user_id, state.borrow().as_ref().unwrap())) {
        return AlreadySuperAdmin;
    }

    let c2c_args = c2c_grant_super_admin::Args {};
    match user_canister_c2c_client::c2c_grant_super_admin(args.user_id.into(), &c2c_args).await {
        Ok(_) => {
            RUNTIME_STATE.with(|state| commit(args.user_id, state.borrow_mut().as_mut().unwrap()));
            Success
        }
        Err(error) => InternalError(format!("{:?}", error)),
    }
}

fn is_already_super_admin(user_id: &UserId, runtime_state: &RuntimeState) -> bool {
    runtime_state.data.super_admins.contains(user_id)
}

fn commit(user_id: UserId, runtime_state: &mut RuntimeState) {
    runtime_state.data.super_admins.insert(user_id);
}