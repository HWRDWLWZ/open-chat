use crate::updates::put_avatar_chunk::Response::*;
use crate::{RuntimeState, RUNTIME_STATE};
use group_canister::put_avatar_chunk::*;
use ic_cdk_macros::update;
use utils::blob_storage::PutChunkResult;

#[update]
fn put_avatar_chunk(args: Args) -> Response {
    RUNTIME_STATE.with(|state| put_avatar_chunk_impl(args, state.borrow_mut().as_mut().unwrap()))
}

fn put_avatar_chunk_impl(args: Args, runtime_state: &mut RuntimeState) -> Response {
    let caller = runtime_state.env.caller();
    if let Some(participant) = runtime_state.data.participants.get_by_principal(&caller) {
        if participant.role.can_set_avatar() {
            let now = runtime_state.env.now();

            let result = match runtime_state.data.blob_storage.put_chunk(
                args.blob_id,
                args.mime_type,
                args.total_chunks,
                args.index,
                args.bytes,
                now,
            ) {
                PutChunkResult::Success => Success,
                PutChunkResult::Complete => {
                    if let Some(avatar_blob_id) = runtime_state.data.avatar_blob_id {
                        runtime_state.data.blob_storage.delete_blob(&avatar_blob_id);
                    }
                    runtime_state.data.avatar_blob_id = Some(args.blob_id);
                    Success
                }
                PutChunkResult::BlobAlreadyExists => BlobAlreadyExists,
                PutChunkResult::ChunkAlreadyExists => ChunkAlreadyExists,
                PutChunkResult::ChunkTooBig => ChunkTooBig,
                PutChunkResult::Full => Full,
            };

            return result;
        }
    }

    CallerNotGroupAdmin
}