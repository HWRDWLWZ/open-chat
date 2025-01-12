use crate::{CachedGroupSummaries, Data};
use group_index_canister::c2c_filter_groups;
use ic_cdk::api::call::CallResult;
use std::collections::{HashMap, HashSet};
use types::{
    CanisterId, ChatId, DeletedGroupInfo, GroupCanisterGroupChatSummary, GroupCanisterGroupChatSummaryUpdates, TimestampMillis,
};
use user_canister::updates::UpdatesSince;

pub(crate) struct SummariesArgs {
    group_index_canister_id: CanisterId,
    group_chat_ids: Vec<ChatId>,
    cached_group_summaries: Option<CachedGroupSummaries>,
    now: TimestampMillis,
}

pub(crate) struct UpdatesArgs {
    group_index_canister_id: CanisterId,
    updates_since: UpdatesSince,
    group_chat_ids: Vec<ChatId>,
    group_chat_ids_with_my_changes: Vec<ChatId>,
    now: TimestampMillis,
}

pub(crate) struct Updates {
    pub added: Vec<GroupCanisterGroupChatSummary>,
    pub updated: Vec<GroupCanisterGroupChatSummaryUpdates>,
    pub deleted: Vec<DeletedGroupInfo>,
}

pub(crate) fn build_summaries_args(disable_cache: bool, now: TimestampMillis, data: &Data) -> SummariesArgs {
    SummariesArgs {
        group_index_canister_id: data.group_index_canister_id,
        group_chat_ids: data.group_chats.iter().map(|g| g.chat_id).collect(),
        cached_group_summaries: if disable_cache { None } else { data.cached_group_summaries.clone() },
        now,
    }
}

pub(crate) async fn summaries(args: SummariesArgs) -> Result<Vec<GroupCanisterGroupChatSummary>, String> {
    let updates_args = UpdatesArgs {
        group_index_canister_id: args.group_index_canister_id,
        updates_since: args
            .cached_group_summaries
            .as_ref()
            .map_or(UpdatesSince::default(), |c| c.updates_args()),
        group_chat_ids: args.group_chat_ids,
        group_chat_ids_with_my_changes: Vec::new(),
        now: args.now,
    };

    let updates = updates(updates_args).await?;

    let groups = if let Some(cached) = args.cached_group_summaries {
        let mut merged = merge_updates(cached.groups, updates.updated);
        if !updates.deleted.is_empty() {
            let deleted: HashSet<_> = updates.deleted.into_iter().map(|d| d.id).collect();
            merged.retain(|g| !deleted.contains(&g.chat_id));
        }
        merged.extend(updates.added);
        merged
    } else {
        updates.added
    };

    Ok(groups)
}

async fn updates(args: UpdatesArgs) -> Result<Updates, String> {
    let group_chat_args_map: HashMap<_, _> = args
        .updates_since
        .group_chats
        .iter()
        .map(|g| (g.chat_id, g.updates_since))
        .collect();

    let mut group_chats_added = Vec::new();
    let mut group_chats_to_check_for_updates = Vec::new();

    for chat_id in args.group_chat_ids {
        if let Some(updates_since) = group_chat_args_map.get(&chat_id) {
            group_chats_to_check_for_updates.push((chat_id, *updates_since));
        } else {
            group_chats_added.push(chat_id);
        }
    }

    let mut all_groups: Vec<_> = group_chats_added.clone();
    all_groups.extend(group_chats_to_check_for_updates.iter().map(|(id, _)| *id));

    let mut added = Vec::new();
    let mut updated = Vec::new();
    let mut deleted = Vec::new();
    if !all_groups.is_empty() {
        let duration_since_last_sync = if args.updates_since.timestamp == 0 {
            None
        } else {
            Some(args.now.saturating_sub(args.updates_since.timestamp))
        };

        let filter_groups_args = c2c_filter_groups::Args {
            chat_ids: all_groups,
            active_in_last: duration_since_last_sync,
        };
        let filter_groups_result =
            match group_index_canister_c2c_client::c2c_filter_groups(args.group_index_canister_id, &filter_groups_args).await {
                Ok(group_index_canister::c2c_filter_groups::Response::Success(result)) => result,
                Err(error) => return Err(format!("Failed to call 'c2c_filter_groups': {error:?}")),
            };

        let active_groups: HashSet<_> = filter_groups_result.active_groups.into_iter().collect();
        group_chats_added.retain(|id| !has_group_been_deleted(&filter_groups_result.deleted_groups, id));
        group_chats_to_check_for_updates
            .retain(|(id, _)| active_groups.contains(id) || args.group_chat_ids_with_my_changes.contains(id));

        let summaries_future = c2c::summaries(group_chats_added);
        let summary_updates_future = c2c::summary_updates(group_chats_to_check_for_updates);

        let (s, su) = futures::future::join(summaries_future, summary_updates_future).await;

        added = s.map_err(|(code, msg)| format!("Failed to get summaries. {code:?}: {msg}"))?;
        updated = su.map_err(|(code, msg)| format!("Failed to get summary updates. {code:?}: {msg}"))?;
        deleted = filter_groups_result.deleted_groups;
    }

    Ok(Updates { added, updated, deleted })
}

fn merge_updates(
    summaries: Vec<GroupCanisterGroupChatSummary>,
    updates: Vec<GroupCanisterGroupChatSummaryUpdates>,
) -> Vec<GroupCanisterGroupChatSummary> {
    if updates.is_empty() {
        summaries
    } else {
        let mut updates_map: HashMap<_, _> = updates.into_iter().map(|s| (s.chat_id, s)).collect();

        summaries
            .into_iter()
            .map(|s| if let Some(u) = updates_map.remove(&s.chat_id) { s.merge(u) } else { s })
            .collect()
    }
}

fn has_group_been_deleted(groups: &[DeletedGroupInfo], group_id: &ChatId) -> bool {
    groups.iter().any(|g| g.id == *group_id)
}

mod c2c {
    use super::*;

    pub async fn summaries(chat_ids: Vec<ChatId>) -> CallResult<Vec<GroupCanisterGroupChatSummary>> {
        if chat_ids.is_empty() {
            return Ok(Vec::new());
        }

        let args = group_canister::summary::Args {};
        let futures: Vec<_> = chat_ids
            .into_iter()
            .map(|chat_id| group_canister_c2c_client::c2c_summary(chat_id.into(), &args))
            .collect();

        let responses: CallResult<Vec<group_canister::summary::Response>> =
            futures::future::join_all(futures).await.into_iter().collect();

        let mut summaries = Vec::new();
        // Exit if any failed, this ensures we never miss any updates
        for response in responses? {
            if let group_canister::summary::Response::Success(result) = response {
                summaries.push(result.summary);
            }
        }

        Ok(summaries)
    }

    pub async fn summary_updates(
        group_chats: Vec<(ChatId, TimestampMillis)>,
    ) -> CallResult<Vec<GroupCanisterGroupChatSummaryUpdates>> {
        if group_chats.is_empty() {
            return Ok(Vec::new());
        }

        async fn get_summary_updates(
            canister_id: CanisterId,
            args: group_canister::summary_updates::Args,
        ) -> CallResult<group_canister::summary_updates::Response> {
            group_canister_c2c_client::c2c_summary_updates(canister_id, &args).await
        }

        let futures: Vec<_> = group_chats
            .into_iter()
            .map(|(g, t)| {
                let args = group_canister::summary_updates::Args { updates_since: t };
                get_summary_updates(g.into(), args)
            })
            .collect();

        let responses: CallResult<Vec<group_canister::summary_updates::Response>> =
            futures::future::join_all(futures).await.into_iter().collect();

        let mut summary_updates = Vec::new();
        // Exit if any failed, this ensures we never miss any updates
        for response in responses? {
            if let group_canister::summary_updates::Response::Success(result) = response {
                summary_updates.push(result.updates);
            }
        }

        Ok(summary_updates)
    }
}
