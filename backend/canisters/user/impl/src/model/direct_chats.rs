use crate::model::direct_chat::DirectChat;
use chat_events::PushMessageArgs;
use serde::{Deserialize, Serialize};
use std::collections::hash_map::Entry::{Occupied, Vacant};
use std::collections::HashMap;
use types::{ChatId, ChatMetrics, EventWrapper, Message, MessageIndex, TimestampMillis, UserId};

#[derive(Serialize, Deserialize, Default)]
pub struct DirectChats {
    direct_chats: HashMap<ChatId, DirectChat>,
    metrics: ChatMetrics,
}

impl DirectChats {
    pub fn get(&self, chat_id: &ChatId) -> Option<&DirectChat> {
        self.direct_chats.get(chat_id)
    }

    pub fn get_mut(&mut self, chat_id: &ChatId) -> Option<&mut DirectChat> {
        self.direct_chats.get_mut(chat_id)
    }

    pub fn get_all(&self, updated_since: Option<TimestampMillis>, now: TimestampMillis) -> impl Iterator<Item = &DirectChat> {
        self.direct_chats.values().filter(move |&c| {
            if let Some(updated_since) = updated_since {
                c.last_updated(now) > updated_since
            } else {
                true
            }
        })
    }

    pub fn iter(&self) -> impl Iterator<Item = &DirectChat> {
        self.direct_chats.values()
    }

    pub fn len(&self) -> usize {
        self.direct_chats.len()
    }

    pub fn push_message(
        &mut self,
        sent_by_me: bool,
        their_user_id: UserId,
        their_message_index: Option<MessageIndex>,
        args: PushMessageArgs,
        is_bot: bool,
    ) -> EventWrapper<Message> {
        let chat_id = ChatId::from(their_user_id);
        let now = args.now;

        let chat: &mut DirectChat = match self.direct_chats.entry(chat_id) {
            Occupied(e) => e.into_mut(),
            Vacant(e) => e.insert(DirectChat::new(their_user_id, is_bot, None, args.now)),
        };

        let message_event = chat.events.push_message(args);

        chat.mark_read_up_to(message_event.event.message_index, sent_by_me, now);

        if !sent_by_me {
            if let Some(their_message_index) = their_message_index {
                chat.unread_message_index_map
                    .add(message_event.event.message_index, their_message_index);
            }
        }

        message_event
    }

    pub fn aggregate_metrics(&mut self) {
        let mut metrics = ChatMetrics::default();

        for chat in self.direct_chats.values() {
            metrics.merge(chat.events.metrics());
        }

        self.metrics = metrics;
    }

    pub fn metrics(&self) -> &ChatMetrics {
        &self.metrics
    }

    pub fn has(&self, chat_id: &ChatId) -> bool {
        self.direct_chats.contains_key(chat_id)
    }
}
