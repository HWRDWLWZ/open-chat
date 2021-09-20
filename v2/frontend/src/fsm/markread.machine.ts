/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createMachine, MachineConfig, MachineOptions, assign, DoneInvokeEvent } from "xstate";
import { log } from "xstate/lib/actions";
import type { ChatSummary, MarkReadResponse, MessageIndexRange } from "../domain/chat/chat";
import { insertIndexIntoRanges, mergeMessageIndexRanges } from "../domain/chat/chat.utils";
import type { ServiceContainer } from "../services/serviceContainer";

/**
 * This machine exists to periodically sync read message state to the backend
 */

const MARK_READ_INTERVAL = 2000;

export interface MarkReadContext {
    serviceContainer: ServiceContainer;
    chatSummary: ChatSummary;
    ranges: MessageIndexRange[];
    pending: MessageIndexRange[];
}

export type MarkReadEvents =
    | { type: "MESSAGE_READ_BY_ME"; data: number }
    | { type: "done.invoke.markMessageRead"; data: MarkReadResponse[] }
    | { type: "error.platform.markMessageRead"; data: Error };

const liveConfig: Partial<MachineOptions<MarkReadContext, MarkReadEvents>> = {
    services: {
        markMessagesRead: async (ctx, _) => {
            if (ctx.pending.length === 0) {
                return Promise.resolve("success");
            } else {
                if (ctx.chatSummary.kind === "direct_chat") {
                    return ctx.serviceContainer.markDirectChatMessagesRead(
                        ctx.chatSummary.them,
                        ctx.pending
                    );
                } else if (ctx.chatSummary.kind === "group_chat") {
                    return ctx.serviceContainer.markGroupChatMessagesRead(
                        ctx.chatSummary.chatId,
                        ctx.pending
                    );
                }
            }
            throw new Error("fix me");
        },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const schema: MachineConfig<MarkReadContext, any, MarkReadEvents> = {
    id: "mark_read_machine",
    initial: "idle",
    on: {
        MESSAGE_READ_BY_ME: {
            actions: assign((ctx, ev) => {
                console.log("got message from chat machine", ev);
                return {
                    ranges: insertIndexIntoRanges(ev.data, ctx.ranges),
                };
            }),
        },
    },
    states: {
        idle: {
            after: {
                [MARK_READ_INTERVAL]: "marking_as_read",
            },
        },
        marking_as_read: {
            entry: assign((ctx, _) => ({
                // capture the buffer that we are going to send
                pending: ctx.ranges,
                ranges: [],
            })),
            invoke: {
                id: "markMessagssRead",
                src: "markMessagesRead",
                onDone: {
                    target: "idle",
                    actions: assign((ctx, ev: DoneInvokeEvent<MarkReadResponse>) => {
                        if (ctx.pending.length > 0) {
                            console.log("marked read: ", ctx.pending, ev.data);
                        }
                        return {};
                    }),
                },
                onError: "idle",
            },
        },
    },
};

export const markReadMachine = createMachine<MarkReadContext, MarkReadEvents>(schema, liveConfig);
export type MarkReadMachine = typeof markReadMachine;