use crate::RuntimeState;

mod calculate_hot_groups;
mod calculate_metrics;
pub mod push_group_deleted_notifications;
pub mod upgrade_canisters;

pub(crate) fn start(runtime_state: &RuntimeState) {
    calculate_metrics::start_job();
    calculate_hot_groups::start_job();
    push_group_deleted_notifications::start_job_if_required(runtime_state);
    upgrade_canisters::start_job_if_required(runtime_state);
}
