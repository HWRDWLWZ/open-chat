import type { BlobReference, DataContent } from "../data/data";
import type { PartialUserSummary, UserSummary } from "../user/user";
import type { OptionUpdate } from "../optionUpdate";
import type { Cryptocurrency } from "../crypto";

export type InternalError = { kind: "internal_error" };
export type UserSuspended = { kind: "user_suspended" };
export type CallerNotInGroup = { kind: "caller_not_in_group" };

export type MessageContent =
    | FileContent
    | TextContent
    | ImageContent
    | VideoContent
    | AudioContent
    | DeletedContent
    | PlaceholderContent
    | PollContent
    | CryptocurrencyContent
    | GiphyContent
    | ProposalContent
    | PrizeContent
    | PrizeWinnerContent;

export type IndexRange = [number, number];

export interface PlaceholderContent {
    kind: "placeholder_content";
}

export type CryptocurrencyDeposit = {
    token: Cryptocurrency;
    amountE8s: bigint;
    feeE8s: bigint;
    memo: bigint;
    blockIndex: bigint;
    fromAddress: string;
};

export type PendingCryptocurrencyWithdrawal = {
    kind: "pending";
    token: Cryptocurrency;
    to: string;
    amountE8s: bigint;
    feeE8s?: bigint;
    memo?: bigint;
};

export type CompletedCryptocurrencyWithdrawal = {
    kind: "completed";
    token: Cryptocurrency;
    to: string;
    amountE8s: bigint;
    feeE8s: bigint;
    memo: bigint;
    blockIndex: bigint;
    transactionHash: string;
};

export type FailedCryptocurrencyWithdrawal = {
    kind: "failed";
    token: Cryptocurrency;
    to: string;
    amountE8s: bigint;
    feeE8s: bigint;
    memo: bigint;
    errorMessage: string;
};

export type WithdrawCryptocurrencyResponse =
    | { kind: "currency_not_supported" }
    | FailedCryptocurrencyWithdrawal
    | CompletedCryptocurrencyWithdrawal;

export type CryptocurrencyWithdrawal =
    | PendingCryptocurrencyWithdrawal
    | CompletedCryptocurrencyWithdrawal
    | FailedCryptocurrencyWithdrawal;

export type CompletedCryptocurrencyTransfer = {
    kind: "completed";
    token: Cryptocurrency;
    recipient: string;
    sender: string;
    amountE8s: bigint;
    feeE8s: bigint;
    memo: bigint;
    blockIndex: bigint;
    transactionHash: string;
};

export type PendingCryptocurrencyTransfer = {
    kind: "pending";
    token: Cryptocurrency;
    recipient: string;
    amountE8s: bigint;
    feeE8s?: bigint;
    memo?: bigint;
};

export type FailedCryptocurrencyTransfer = {
    kind: "failed";
    token: Cryptocurrency;
    recipient: string;
    amountE8s: bigint;
    feeE8s: bigint;
    memo: bigint;
    errorMessage: string;
};

export type CryptocurrencyTransfer =
    | CompletedCryptocurrencyTransfer
    | PendingCryptocurrencyTransfer
    | FailedCryptocurrencyTransfer;

export type CryptocurrencyTransaction =
    | CryptocurrencyTransfer
    | CryptocurrencyWithdrawal
    | CryptocurrencyDeposit;

export interface CryptocurrencyContent {
    kind: "crypto_content";
    caption?: string;
    transfer: CryptocurrencyTransfer;
}

export type GiphyImage = {
    height: number;
    width: number;
    url: string;
    mimeType: string;
};

export interface GiphyContent {
    kind: "giphy_content";
    caption?: string;
    title: string;
    desktop: GiphyImage; //will be "original" from the giphy api
    mobile: GiphyImage; //will be "downsized_large" from the giphy api
}

export interface PrizeWinnerContent {
    kind: "prize_winner_content";
    transaction: CompletedCryptocurrencyTransfer;
    prizeMessageIndex: number;
}

export interface PrizeContent {
    kind: "prize_content";
    prizesRemaining: number;
    prizesPending: number;
    winners: string[];
    token: Cryptocurrency;
    endDate: bigint;
    caption?: string;
}

export interface ProposalContent {
    kind: "proposal_content";
    governanceCanisterId: string;
    proposal: Proposal;
    myVote?: boolean;
}

export type Proposal = NnsProposal | SnsProposal;

export interface ProposalCommon {
    id: bigint;
    url: string;
    status: ProposalDecisionStatus;
    tally: Tally;
    title: string;
    created: number;
    deadline: number;
    lastUpdated: number;
    rewardStatus: ProposalRewardStatus;
    summary: string;
    proposer: string;
}

export interface Tally {
    yes: number;
    no: number;
    total: number;
}

export interface NnsProposal extends ProposalCommon {
    kind: "nns";
    topic: NnsProposalTopic;
}

export enum ProposalDecisionStatus {
    Unspecified,
    Failed,
    Open,
    Rejected,
    Executed,
    Adopted,
}

export enum ProposalRewardStatus {
    Unspecified,
    AcceptVotes,
    ReadyToSettle,
    Settled,
}

export enum NnsProposalTopic {
    Unspecified,
    NeuronManagement,
    ExchangeRate,
    NetworkEconomics,
    Governance,
    NodeAdmin,
    ParticipantManagement,
    SubnetManagement,
    NetworkCanisterManagement,
    KYC,
    NodeProviderRewards,
    SnsDecentralizationSale,
    SubnetReplicaVersionManagement,
    ReplicaVersionManagement,
    SnsAndCommunityFund,
}

export interface SnsProposal extends ProposalCommon {
    kind: "sns";
    action: number;
    payloadTextRendering?: string;
}

export interface ImageContent extends DataContent {
    kind: "image_content";
    height: number;
    width: number;
    thumbnailData: string;
    caption?: string;
    mimeType: string;
}

export interface VideoContent {
    kind: "video_content";
    height: number;
    width: number;
    thumbnailData: string;
    caption?: string;
    mimeType: string;
    imageData: DataContent;
    videoData: DataContent;
}

export interface AudioContent extends DataContent {
    kind: "audio_content";
    caption?: string;
    mimeType: string;
}

export type DeletedContent = {
    kind: "deleted_content";
    deletedBy: string;
    timestamp: bigint;
};

export type PollContent = {
    kind: "poll_content";
    votes: PollVotes;
    config: PollConfig;
    ended: boolean;
};

export type PollVotes = {
    total: TotalPollVotes;
    user: number[];
};

export type PollConfig = {
    allowMultipleVotesPerUser: boolean;
    text?: string;
    showVotesBeforeEndDate: boolean;
    endDate?: bigint;
    anonymous: boolean;
    options: string[];
};

export type TotalPollVotes = AnonymousPollVotes | VisiblePollVotes | HiddenPollVotes;

export type AnonymousPollVotes = {
    kind: "anonymous_poll_votes";
    votes: Record<number, number>;
};

export type VisiblePollVotes = {
    kind: "visible_poll_votes";
    votes: Record<number, string[]>;
};

export type HiddenPollVotes = {
    kind: "hidden_poll_votes";
    votes: number;
};

export interface TextContent {
    kind: "text_content";
    text: string;
}

export type StoredMediaContent = FileContent | VideoContent | AudioContent | ImageContent;

export interface FileContent extends DataContent {
    kind: "file_content";
    name: string;
    caption?: string;
    mimeType: string;
    fileSize: number;
}

export type ReplyContext = RawReplyContext | RehydratedReplyContext;

export type RawReplyContext = {
    kind: "raw_reply_context";
    eventIndex: number;
    chatIdIfOther?: string;
};

export type RehydratedReplyContext = {
    kind: "rehydrated_reply_context";
    content: MessageContent;
    senderId: string;
    messageId: bigint;
    messageIndex: number;
    eventIndex: number;
    chatId: string;
    edited: boolean;
    isThreadRoot: boolean;
};

export type EnhancedReplyContext = RehydratedReplyContext & {
    sender?: PartialUserSummary;
    content: MessageContent;
};

export type Message = {
    kind: "message";
    messageId: bigint;
    messageIndex: number;
    sender: string;
    content: MessageContent;
    repliesTo?: ReplyContext;
    reactions: Reaction[];
    edited: boolean;
    forwarded: boolean;
    deleted: boolean;
    thread?: ThreadSummary;
};

export type ThreadSummary = {
    participantIds: Set<string>;
    numberOfReplies: number;
    latestEventIndex: number;
    latestEventTimestamp: bigint;
};

export type LocalReaction = {
    reaction: string;
    kind: "add" | "remove";
    userId: string; // this can actually be a remote user via rtc
};

export type Reaction = {
    reaction: string;
    userIds: Set<string>;
};

export type LocalPollVote = {
    answerIndex: number;
    type: "register" | "delete";
    userId: string;
};

export type LocalChatSummaryUpdates = {
    added?: ChatSummary;
    updated?:
        | {
              kind?: undefined;
              notificationsMuted?: boolean;
              archived?: boolean;
          }
        | {
              kind: "group_chat";
              name?: string;
              description?: string;
              public?: boolean;
              myRole?: MemberRole;
              permissions?: Partial<GroupPermissions>;
              notificationsMuted?: boolean;
              archived?: boolean;
              frozen?: boolean;
          };
    removedAtTimestamp?: bigint;
    lastUpdated: number;
};

export type LocalMessageUpdates = {
    deleted?: {
        deletedBy: string;
        timestamp: bigint;
    };
    editedContent?: MessageContent;
    undeletedContent?: MessageContent;
    revealedContent?: MessageContent;
    prizeClaimed?: string;
    reactions?: LocalReaction[];
    pollVotes?: LocalPollVote[];
    threadSummary?: ThreadSummary;
    lastUpdated: number;
};

export type EventsResponse<T extends ChatEvent> = "events_failed" | EventsSuccessResult<T>;

export type DirectChatEvent =
    | Message
    | MessageDeleted
    | MessageUndeleted
    | MessageEdited
    | ReactionAdded
    | ReactionRemoved
    | PollVoteDeleted
    | PollVoteRegistered
    | PollEnded
    | DirectChatCreated
    | ThreadUpdated;

export type GroupChatEvent =
    | Message
    | GroupChatCreated
    | MembersAdded
    | MemberJoined
    | AggregateCommonEvents
    | MembersRemoved
    | MemberLeft
    | GroupNameChanged
    | AvatarChanged
    | MessageDeleted
    | MessageUndeleted
    | MessageEdited
    | ReactionAdded
    | ReactionRemoved
    | GroupDescChanged
    | GroupRulesChanged
    | UsersBlocked
    | UsersUnblocked
    | MemberAssumesSuperAdmin
    | MemberRelinquishesSuperAdmin
    | MemberDismissedAsSuperAdmin
    | RoleChanged
    | OwnershipTransferred
    | MessagePinned
    | MessageUnpinned
    | PollVoteRegistered
    | PollVoteDeleted
    | PollEnded
    | PermissionsChanged
    | GroupVisibilityChanged
    | GroupInviteCodeChanged
    | DirectChatCreated
    | ThreadUpdated
    | ProposalsUpdated
    | ChatFrozenEvent
    | ChatUnfrozenEvent
    | EventsTimeToLiveUpdated;

export type ChatEvent = GroupChatEvent | DirectChatEvent;

export type MembersAdded = {
    kind: "members_added";
    userIds: string[];
    addedBy: string;
};

export type AggregateCommonEvents = {
    kind: "aggregate_common_events";
    usersJoined: Set<string>;
    usersLeft: Set<string>;
    messagesDeleted: number[];
};

export type MemberJoined = {
    kind: "member_joined";
    userId: string;
};

export type MemberLeft = {
    kind: "member_left";
    userId: string;
};

export type GroupNameChanged = {
    kind: "name_changed";
    changedBy: string;
};

export type GroupDescChanged = {
    kind: "desc_changed";
    changedBy: string;
};

export type GroupRulesChanged = {
    kind: "rules_changed";
    enabled: boolean;
    enabledPrev: boolean;
    changedBy: string;
};

export type AvatarChanged = {
    kind: "avatar_changed";
    changedBy: string;
};

export type MessageDeleted = {
    kind: "message_deleted";
    message: StaleMessage;
};

export type MessageUndeleted = {
    kind: "message_undeleted";
    message: StaleMessage;
};

export type MessageEdited = {
    kind: "message_edited";
    message: StaleMessage;
};

export type ReactionAdded = {
    kind: "reaction_added";
    message: StaleMessage;
};

export type ReactionRemoved = {
    kind: "reaction_removed";
    message: StaleMessage;
};

export type StaleMessage = {
    updatedBy: string;
    eventIndex: number;
    messageId: bigint;
};

export type UsersBlocked = {
    kind: "users_blocked";
    userIds: string[];
    blockedBy: string;
};

export type UsersUnblocked = {
    kind: "users_unblocked";
    userIds: string[];
    unblockedBy: string;
};

export type MembersRemoved = {
    kind: "members_removed";
    userIds: string[];
    removedBy: string;
};

export type OwnershipTransferred = {
    kind: "ownership_transferred";
    oldOwner: string;
    newOwner: string;
};

export type MemberAssumesSuperAdmin = {
    kind: "member_assumes_super_admin";
    userId: string;
};

export type MemberRelinquishesSuperAdmin = {
    kind: "member_relinquishes_super_admin";
    userId: string;
};

export type MemberDismissedAsSuperAdmin = {
    kind: "member_dismissed_as_super_admin";
    userId: string;
};

export type PollVoteRegistered = {
    kind: "poll_vote_registered";
    message: StaleMessage;
};

export type PollVoteDeleted = {
    kind: "poll_vote_deleted";
    message: StaleMessage;
};

export type PollEnded = {
    kind: "poll_ended";
    messageIndex: number;
    eventIndex: number;
};

export type ThreadUpdated = {
    kind: "thread_updated";
    messageIndex: number;
    eventIndex: number;
};

export type ProposalsUpdated = {
    kind: "proposals_updated";
    proposals: {
        messageIndex: number;
        eventIndex: number;
    }[];
};

export type PermissionsChanged = {
    kind: "permissions_changed";
    oldPermissions: GroupPermissions;
    newPermissions: GroupPermissions;
    changedBy: string;
};

export type GroupVisibilityChanged = {
    kind: "group_visibility_changed";
    nowPublic: boolean;
    changedBy: string;
};

export type GroupInviteCodeChanged = {
    kind: "group_invite_code_changed";
    change: GroupInviteCodeChange;
    changedBy: string;
};

export type GroupInviteCodeChange = "enabled" | "disabled" | "reset";

export type MessagePinned = {
    kind: "message_pinned";
    pinnedBy: string;
    messageIndex: number;
};

export type MessageUnpinned = {
    kind: "message_unpinned";
    unpinnedBy: string;
    messageIndex: number;
};

export type RoleChanged = {
    kind: "role_changed";
    userIds: string[];
    changedBy: string;
    oldRole: MemberRole;
    newRole: MemberRole;
};

export type PinnedMessageUpdated = {
    kind: "pinned_message_updated";
    newValue: number | undefined; // MessageIndex
    updatedBy: string;
};

export type GroupChatCreated = {
    kind: "group_chat_created";
    name: string;
    description: string;
    created_by: string;
};

export type DirectChatCreated = {
    kind: "direct_chat_created";
};

export type EventWrapper<T extends ChatEvent> = {
    event: T;
    timestamp: bigint;
    index: number;
};

export type EventsSuccessResult<T extends ChatEvent> = {
    events: EventWrapper<T>[];
    affectedEvents: EventWrapper<T>[];
    latestEventIndex: number | undefined;
};

export type UpdatesResult = {
    state: ChatStateFull;
    affectedEvents: Record<string, number[]>;
    anyUpdates: boolean;
    anyErrors: boolean;
};

export type ChatStateFull = {
    timestamp: bigint;
    directChats: DirectChatSummary[];
    groupChats: GroupChatSummary[];
    avatarId: bigint | undefined;
    blockedUsers: string[];
    pinnedChats: string[];
};

export type MergedUpdatesResponse = {
    wasUpdated: boolean;
    chatSummaries: ChatSummary[];
    blockedUsers: Set<string>;
    pinnedChats: string[];
    avatarIdUpdate: OptionUpdate<bigint>;
    affectedEvents: Record<string, number[]>;
    timestamp: bigint;
};

export type CurrentChatState = {
    chatSummaries: ChatSummary[];
    blockedUsers: Set<string>;
    pinnedChats: string[];
};

export type UpdatesResponse = {
    blockedUsers: Set<string> | undefined;
    pinnedChats: string[] | undefined;
    chatsUpdated: ChatSummaryUpdates[];
    chatsAdded: ChatSummary[];
    chatsRemoved: Set<string>;
    avatarIdUpdate: OptionUpdate<bigint>;
    timestamp: bigint;
    cyclesBalance?: bigint;
    transactions: CryptocurrencyTransfer[];
};

export type InitialStateResponse = {
    blockedUsers: Set<string>;
    pinnedChats: string[];
    chats: ChatSummary[];
    timestamp: bigint;
    cyclesBalance: bigint;
};

export type InitialStateV2Response = {
    timestamp: bigint;
    directChats: DirectChatSummary[];
    cacheTimestamp: bigint | undefined;
    cachedGroupChatSummaries: GroupChatSummary[];
    groupChatsAdded: UserCanisterGroupChatSummary[];
    avatarId: bigint | undefined;
    blockedUsers: string[];
    pinnedChats: string[];
};

export type UpdatesV2Response = {
    timestamp: bigint;
    directChatsAdded: DirectChatSummary[];
    directChatsUpdated: DirectChatSummaryUpdates[];
    groupChatsAdded: UserCanisterGroupChatSummary[];
    groupChatsUpdated: UserCanisterGroupChatSummaryUpdates[];
    chatsRemoved: string[];
    avatarId: OptionUpdate<bigint>;
    blockedUsers: string[] | undefined;
    pinnedChats: string[] | undefined;
};

export type UserCanisterGroupChatSummary = {
    chatId: string;
    readByMeUpTo: number | undefined;
    threadsRead: Record<number, number>;
    archived: boolean;
    dateReadPinned: bigint | undefined;
};

export type UserCanisterGroupChatSummaryUpdates = {
    chatId: string;
    readByMeUpTo: number | undefined;
    threadsRead: Record<number, number>;
    archived: boolean | undefined;
    dateReadPinned: bigint | undefined;
};

export type ChatSummaryUpdates = DirectChatSummaryUpdates | GroupChatSummaryUpdates;

type ChatSummaryUpdatesCommon = {
    chatId: string;
    readByMeUpTo?: number;
    latestEventIndex?: number;
    latestMessage?: EventWrapper<Message>;
    notificationsMuted?: boolean;
    affectedEvents: number[];
    metrics?: ChatMetrics;
    myMetrics?: ChatMetrics;
    archived?: boolean;
};

export type DirectChatSummaryUpdates = ChatSummaryUpdatesCommon & {
    kind: "direct_chat";
    readByThemUpTo?: number;
};

export type GroupChatSummaryUpdates = ChatSummaryUpdatesCommon & {
    kind: "group_chat";
    lastUpdated: bigint;
    name?: string;
    description?: string;
    avatarBlobReferenceUpdate?: OptionUpdate<BlobReference>;
    memberCount?: number;
    myRole?: MemberRole;
    mentions: Mention[];
    ownerId?: string;
    permissions?: GroupPermissions;
    public?: boolean;
    latestThreads?: ThreadSyncDetailsUpdates[];
    subtype?: GroupSubtypeUpdate;
    frozen?: OptionUpdate<boolean>;
    dateLastPinned?: bigint;
    dateReadPinned?: bigint;
};

export type GroupSubtypeUpdate =
    | { kind: "no_change" }
    | { kind: "set_to_none" }
    | { kind: "set_to_some"; subtype: GroupSubtype };

export type ThreadSyncDetailsUpdates = {
    threadRootMessageIndex: number;
    lastUpdated: bigint;
    readUpTo?: number;
    latestEventIndex?: number;
    latestMessageIndex?: number;
};

export type ThreadSyncDetails = {
    threadRootMessageIndex: number;
    lastUpdated: bigint;
    readUpTo?: number;
    latestEventIndex: number;
    latestMessageIndex: number;
};

export type MemberRole = "admin" | "participant" | "owner" | "super_admin" | "previewer";

export type Member = {
    role: MemberRole;
    userId: string;
};

export type FullMember = Member & PartialUserSummary & { memberKind: "full_member" };
export type BlockedMember = Member & PartialUserSummary & { memberKind: "blocked_member" };

export type PermissionRole = "owner" | "admins" | "members";

export type GroupPermissions = {
    changePermissions: PermissionRole;
    changeRoles: PermissionRole;
    addMembers: PermissionRole;
    removeMembers: PermissionRole;
    blockUsers: PermissionRole;
    deleteMessages: PermissionRole;
    updateGroup: PermissionRole;
    pinMessages: PermissionRole;
    inviteUsers: PermissionRole;
    createPolls: PermissionRole;
    sendMessages: PermissionRole;
    reactToMessages: PermissionRole;
    replyInThread: PermissionRole;
};

export type GroupChatDetailsResponse = "caller_not_in_group" | GroupChatDetails;

export type GroupChatDetailsUpdatesResponse =
    | ({ kind: "success" } & GroupChatDetailsUpdates)
    | { kind: "success_no_updates"; latestEventIndex: number }
    | "caller_not_in_group";

export type GroupChatDetails = {
    members: Member[];
    blockedUsers: Set<string>;
    pinnedMessages: Set<number>;
    latestEventIndex: number;
    rules: GroupRules;
};

/**
 * This will hold all chat specific state
 * All properties are optional but individual derived stores can provide their own default values
 */
export type ChatSpecificState = {
    detailsLoaded: boolean;
    members: Member[];
    blockedUsers: Set<string>;
    pinnedMessages: Set<number>;
    latestEventIndex?: number;
    rules?: GroupRules;
    userIds: Set<string>;
    focusMessageIndex?: number;
    userGroupKeys: Set<string>;
    serverEvents: EventWrapper<ChatEvent>[];
    expandedDeletedMessages: Set<number>;
};

export type GroupRules = {
    text: string;
    enabled: boolean;
};

export const defaultGroupRules = `- Do not impersonate others in a deceptive or misleading manner
- Do not intentionally share false or misleading information
- Keep messages relevant to the group

If you break the rules you might be blocked and/or have your message(s) deleted.`;

export type GroupChatDetailsUpdates = {
    membersAddedOrUpdated: Member[];
    membersRemoved: Set<string>;
    blockedUsersAdded: Set<string>;
    blockedUsersRemoved: Set<string>;
    pinnedMessagesRemoved: Set<number>;
    pinnedMessagesAdded: Set<number>;
    latestEventIndex: number;
    rules?: GroupRules;
};

export type ChatSummary = DirectChatSummary | GroupChatSummary;

type ChatSummaryCommon = {
    chatId: string; // this represents a Principal
    readByMeUpTo: number | undefined;
    latestEventIndex: number;
    latestMessage?: EventWrapper<Message>;
    notificationsMuted: boolean;
    metrics: ChatMetrics;
    myMetrics: ChatMetrics;
    archived: boolean;
};

export type DirectChatSummary = ChatSummaryCommon & {
    kind: "direct_chat";
    them: string;
    readByThemUpTo: number | undefined;
    dateCreated: bigint;
};

export type GroupChatSummary = DataContent &
    ChatSummaryCommon & {
        kind: "group_chat";
        name: string;
        description: string;
        joined: bigint;
        minVisibleEventIndex: number;
        minVisibleMessageIndex: number;
        lastUpdated: bigint;
        memberCount: number;
        mentions: Mention[];
        ownerId: string;
        public: boolean;
        myRole: MemberRole;
        permissions: GroupPermissions;
        historyVisibleToNewJoiners: boolean;
        latestThreads: ThreadSyncDetails[];
        subtype: GroupSubtype;
        previewed: boolean;
        frozen: boolean;
        dateLastPinned: bigint | undefined;
        dateReadPinned: bigint | undefined;
    };

export type GroupCanisterSummaryResponse = GroupCanisterGroupChatSummary | CallerNotInGroup;

export type GroupCanisterSummaryUpdatesResponse =
    | GroupCanisterGroupChatSummaryUpdates
    | { kind: "success_no_updates" }
    | CallerNotInGroup;

export type GroupCanisterGroupChatSummary = {
    chatId: string;
    lastUpdated: bigint;
    name: string;
    description: string;
    subtype: GroupSubtype;
    avatarId: bigint | undefined;
    public: boolean;
    historyVisibleToNewJoiners: boolean;
    minVisibleEventIndex: number;
    minVisibleMessageIndex: number;
    latestMessage: EventWrapper<Message> | undefined;
    latestEventIndex: number;
    joined: bigint;
    memberCount: number;
    myRole: MemberRole;
    mentions: Mention[];
    ownerId: string;
    permissions: GroupPermissions;
    notificationsMuted: boolean;
    metrics: ChatMetrics;
    myMetrics: ChatMetrics;
    latestThreads: GroupCanisterThreadDetails[];
    frozen: boolean;
    dateLastPinned: bigint | undefined;
};

export type GroupCanisterGroupChatSummaryUpdates = {
    chatId: string;
    lastUpdated: bigint;
    name: string | undefined;
    description: string | undefined;
    subtype: OptionUpdate<GroupSubtype>;
    avatarId: OptionUpdate<bigint>;
    public: boolean | undefined;
    latestMessage: EventWrapper<Message> | undefined;
    latestEventIndex: number | undefined;
    memberCount: number | undefined;
    myRole: MemberRole | undefined;
    mentions: Mention[];
    ownerId: string | undefined;
    permissions: GroupPermissions | undefined;
    notificationsMuted: boolean | undefined;
    metrics: ChatMetrics | undefined;
    myMetrics: ChatMetrics | undefined;
    latestThreads: GroupCanisterThreadDetails[];
    frozen: OptionUpdate<boolean>;
    affectedEvents: number[];
    dateLastPinned: bigint | undefined;
};

export type GroupCanisterThreadDetails = {
    threadRootMessageIndex: number;
    lastUpdated: bigint;
    latestEventIndex: number;
    latestMessageIndex: number;
};

export type GroupSubtype = GovernanceProposalsSubtype | undefined;

export type GovernanceProposalsSubtype = {
    kind: "governance_proposals";
    isNns: boolean;
    governanceCanisterId: string;
};

export type Mention = {
    messageId: bigint;
    eventIndex: number;
    mentionedBy: string;
    messageIndex: number;
};

export type CandidateMember = {
    role: MemberRole;
    user: UserSummary;
};

export type CandidateGroupChat = {
    chatId?: string;
    name: string;
    description: string;
    rules: GroupRules;
    historyVisible: boolean;
    isPublic: boolean;
    members: CandidateMember[];
    avatar?: DataContent;
    permissions: GroupPermissions;
};

// todo - there are all sorts of error conditions here that we need to deal with but - later
export type CreateGroupResponse =
    | CreateGroupSuccess
    | CreateGroupInternalError
    | CreateGroupNameTooShort
    | CreateGroupNameTooLong
    | CreateGroupNameReserved
    | CreateGroupDescriptionTooLong
    | GroupNameTaken
    | AvatarTooBig
    | MaxGroupsCreated
    | CreateGroupThrottled
    | GroupRulesTooShort
    | GroupRulesTooLong
    | UserSuspended;

export type CreateGroupSuccess = {
    kind: "success";
    canisterId: string;
};

export type CreateGroupInternalError = InternalError;

export type CreateGroupInvalidName = {
    kind: "invalid_name";
};

export type CreateGroupNameTooLong = {
    kind: "name_too_long";
};

export type CreateGroupNameTooShort = {
    kind: "name_too_short";
};

export type CreateGroupNameReserved = {
    kind: "name_reserved";
};

export type CreateGroupDescriptionTooLong = {
    kind: "description_too_long";
};

export type GroupNameTaken = {
    kind: "group_name_taken";
};

export type AvatarTooBig = {
    kind: "avatar_too_big";
};

export type GroupRulesTooLong = {
    kind: "rules_too_long";
};

export type GroupRulesTooShort = {
    kind: "rules_too_short";
};

export type MaxGroupsCreated = {
    kind: "max_groups_created";
};

export type CreateGroupThrottled = {
    kind: "throttled";
};

export type AddMembersResponse =
    | AddMembersSuccess
    | AddMembersNotAuthorised
    | MemberLimitReached
    | AddMembersPartialSuccess
    | AddMembersFailed
    | AddMembersNotInGroup
    | UserSuspended
    | ChatFrozen;

export type AddMembersSuccess = {
    kind: "add_members_success";
};

export type AddMembersNotInGroup = {
    kind: "add_members_not_in_group";
};

export type AddMembersNotAuthorised = {
    kind: "add_members_not_authorised";
};

export type MemberLimitReached = {
    kind: "member_limit_reached";
};

export type AddMembersPartialSuccess = {
    kind: "add_members_partial_success";
    usersAdded: string[];
    usersAlreadyInGroup: string[];
    usersBlockedFromGroup: string[];
    usersWhoBlockedRequest: string[];
    errors: string[];
};

export type AddMembersFailed = {
    kind: "add_members_failed";
    usersAlreadyInGroup: string[];
    usersBlockedFromGroup: string[];
    usersWhoBlockedRequest: string[];
    errors: string[];
};

export type EditMessageResponse =
    | "success"
    | "chat_not_found"
    | "message_not_found"
    | "user_blocked"
    | "not_in_group"
    | "user_suspended"
    | "chat_frozen";

export type SendMessageResponse =
    | SendMessageSuccess
    | SendMessageRecipientBlocked
    | SendMessageInvalidRequest
    | SendMessageTooLong
    | SendMessageEmpty
    | TransferCannotBeZero
    | SendMessageRecipientNotFound
    | TransferFailed
    | TransferLimitExceeded
    | TransferSuccess
    | InvalidPoll
    | SendMessageNotInGroup
    | CallerNotInGroup
    | InternalError
    | CryptoCurrencyNotSupported
    | NotAuthorised
    | ThreadMessageNotFound
    | UserSuspended
    | ChatFrozen;

export type SendMessageSuccess = {
    kind: "success";
    timestamp: bigint;
    messageIndex: number;
    eventIndex: number;
};

export type TransferSuccess = {
    kind: "transfer_success";
    timestamp: bigint;
    messageIndex: number;
    eventIndex: number;
    transfer: CompletedCryptocurrencyTransfer;
};

export type InvalidPoll = {
    kind: "invalid_poll";
};

export type ThreadMessageNotFound = {
    kind: "thread_message_not_found";
};

export type CryptoCurrencyNotSupported = {
    kind: "cryptocurrency_not_supported";
};

export type TransferFailed = {
    kind: "transfer_failed";
};

export type TransferLimitExceeded = {
    kind: "transfer_limit_exceeded";
};

export type TransferCannotBeZero = {
    kind: "transfer_cannot_be_zero";
};

export type SendMessageRecipientBlocked = {
    kind: "recipient_blocked";
};

export type SendMessageInvalidRequest = {
    kind: "invalid_request";
    reason: string;
};

export type SendMessageTooLong = {
    kind: "text_too_long";
};

export type SendMessageEmpty = {
    kind: "message_empty";
};

export type SendMessageRecipientNotFound = {
    kind: "recipient_not_found";
};

export type SendMessageNotInGroup = {
    kind: "not_in_group";
};

export type NotAuthorised = {
    kind: "not_authorised";
};

export type ChatFrozen = {
    kind: "chat_frozen";
};

export type ChatFrozenEvent = {
    kind: "chat_frozen";
    frozenBy: string;
    reason: string | undefined;
};

export type ChatUnfrozenEvent = {
    kind: "chat_unfrozen";
    unfrozenBy: string;
};

export type EventsTimeToLiveUpdated = {
    kind: "events_ttl_updated";
    updatedBy: string;
    newTimeToLive: bigint | undefined;
};

export type SetAvatarResponse = "avatar_too_big" | "success" | "internal_error" | "user_suspended";

export type ChangeRoleResponse =
    | "user_not_in_group"
    | "caller_not_in_group"
    | "not_authorised"
    | "invalid"
    | "user_suspended"
    | "chat_frozen"
    | "success";

export type DeleteGroupResponse =
    | "internal_error"
    | "not_authorised"
    | "chat_frozen"
    | "success"
    | "user_suspended";

export type MakeGroupPrivateResponse =
    | "internal_error"
    | "not_authorised"
    | "already_private"
    | "user_suspended"
    | "chat_frozen"
    | "success";

export type RemoveMemberResponse =
    | "user_not_in_group"
    | "caller_not_in_group"
    | "not_authorised"
    | "success"
    | "cannot_remove_self"
    | "cannot_remove_user"
    | "user_suspended"
    | "chat_frozen"
    | "internal_error";

export type BlockUserResponse =
    | "success"
    | "group_not_public"
    | "user_not_in_group"
    | "caller_not_in_group"
    | "not_authorised"
    | "internal_error"
    | "cannot_block_self"
    | "cannot_block_user"
    | "user_suspended"
    | "chat_frozen";

export type UnblockUserResponse =
    | "success"
    | "group_not_public"
    | "cannot_unblock_self"
    | "caller_not_in_group"
    | "not_authorised"
    | "user_suspended"
    | "chat_frozen";

export type LeaveGroupResponse =
    | "success"
    | "group_not_found"
    | "internal_error"
    | "not_in_group"
    | "owner_cannot_leave"
    | "group_not_public"
    | "user_suspended"
    | "chat_frozen";

export type JoinGroupResponse =
    | GroupChatSummary
    | { kind: "blocked" }
    | { kind: "group_not_found" }
    | { kind: "group_not_public" }
    | { kind: "already_in_group" }
    | { kind: "not_super_admin" }
    | { kind: "member_limit_reached" }
    | UserSuspended
    | ChatFrozen
    | InternalError;

export type MarkReadRequest = {
    readUpTo: number | undefined;
    chatId: string;
    threads: ThreadRead[];
    dateReadPinned: bigint | undefined;
}[];

export type ThreadRead = {
    threadRootMessageIndex: number;
    readUpTo: number;
};

export type MarkReadResponse = "success";

export type UpdateGroupResponse =
    | "success"
    | "not_authorised"
    | "name_too_short"
    | "name_too_long"
    | "name_reserved"
    | "desc_too_long"
    | "unchanged"
    | "name_taken"
    | "not_in_group"
    | "avatar_too_big"
    | "rules_too_short"
    | "rules_too_long"
    | "user_suspended"
    | "chat_frozen"
    | "internal_error";

export type UpdatePermissionsResponse =
    | "success"
    | "not_authorised"
    | "not_in_group"
    | "user_suspended"
    | "chat_frozen";

export type AddRemoveReactionResponse =
    | "success"
    | "no_change"
    | "invalid"
    | "message_not_found"
    | "not_in_group"
    | "not_authorised"
    | "chat_not_found"
    | "user_suspended"
    | "chat_frozen";

export type DeleteMessageResponse =
    | "not_in_group"
    | "chat_not_found"
    | "success"
    | "message_not_found"
    | "user_suspended"
    | "chat_frozen";

export type UndeleteMessageResponse =
    | {
          kind: "success";
          message: Message;
      }
    | { kind: "not_in_group" }
    | { kind: "chat_not_found" }
    | { kind: "internal_error" }
    | { kind: "message_not_found" }
    | UserSuspended
    | ChatFrozen;

export type UnpinMessageResponse =
    | "no_change"
    | "caller_not_in_group"
    | "not_authorised"
    | "message_not_found"
    | "user_suspended"
    | "chat_frozen"
    | "success";

export type PinMessageResponse =
    | {
          kind: "success";
          eventIndex: number;
          timestamp: bigint;
      }
    | { kind: "index_out_of_range" }
    | { kind: "no_change" }
    | { kind: "caller_not_in_group" }
    | { kind: "not_authorised" }
    | { kind: "message_not_found" }
    | UserSuspended
    | ChatFrozen;

export type DeletedGroupMessageResponse =
    | {
          kind: "success";
          content: MessageContent;
      }
    | { kind: "caller_not_in_group" }
    | { kind: "not_authorised" }
    | { kind: "message_not_found" }
    | { kind: "message_not_deleted" }
    | { kind: "message_hard_deleted" };

export type DeletedDirectMessageResponse =
    | {
          kind: "success";
          content: MessageContent;
      }
    | { kind: "chat_not_found" }
    | { kind: "not_authorised" }
    | { kind: "message_not_found" }
    | { kind: "message_not_deleted" }
    | { kind: "message_hard_deleted" };

export type RegisterPollVoteResponse =
    | "caller_not_in_group"
    | "poll_ended"
    | "success"
    | "out_of_range"
    | "poll_not_found"
    | "chat_not_found"
    | "user_suspended"
    | "chat_frozen"
    | "polls_not_valid_for_direct_chats";

export type InviteCodeResponse = InviteCodeSuccess | NotAuthorised;

export type InviteCodeSuccess = {
    kind: "success";
    code?: string;
};

export type EnableInviteCodeResponse =
    | EnableInviteCodeSuccess
    | NotAuthorised
    | UserSuspended
    | ChatFrozen;

export type EnableInviteCodeSuccess = {
    kind: "success";
    code: string;
};

export type DisableInviteCodeResponse =
    | "not_authorised"
    | "user_suspended"
    | "chat_frozen"
    | "success";

export type ResetInviteCodeResponse =
    | ResetInviteCodeSuccess
    | NotAuthorised
    | UserSuspended
    | ChatFrozen;

export type ThreadPreviewsResponse = CallerNotInGroup | ThreadPreviewsSuccess;

export type ThreadPreviewsSuccess = {
    kind: "thread_previews_success";
    threads: ThreadPreview[];
};

export type ThreadPreview = {
    chatId: string;
    latestReplies: EventWrapper<Message>[];
    totalReplies: number;
    rootMessage: EventWrapper<Message>;
};

export type ResetInviteCodeSuccess = {
    kind: "success";
    code: string;
};

export type MessageAction = "emoji" | "file" | undefined;

export type ChatMetrics = {
    audioMessages: number;
    cyclesMessages: number;
    edits: number;
    icpMessages: number;
    sns1Messages: number;
    ckbtcMessages: number;
    giphyMessages: number;
    deletedMessages: number;
    reportedMessages: number;
    fileMessages: number;
    pollVotes: number;
    textMessages: number;
    imageMessages: number;
    replies: number;
    videoMessages: number;
    polls: number;
    reactions: number;
};

export type RegisterProposalVoteResponse =
    | "success"
    | "already_voted"
    | "caller_not_in_group"
    | "no_eligible_neurons"
    | "proposal_message_not_found"
    | "proposal_not_found"
    | "proposal_not_accepting_votes"
    | "chat_frozen"
    | "user_suspended"
    | "internal_error";

export type ListNervousSystemFunctionsResponse = {
    reservedIds: bigint[];
    functions: NervousSystemFunction[];
};

export type NervousSystemFunction = {
    id: number;
    name: string;
    description: string;
    functionType?: SnsFunctionType;
};

export type SnsFunctionType =
    | { kind: "native_nervous_system_function" }
    | { kind: "generic_nervous_system_function" };

export type FilterGroupsResponse = {
    timestamp: bigint;
    activeGroups: string[];
    deletedGroups: DeletedGroupInfo[];
    upgradesInProgress: string[];
};

export type DeletedGroupInfo = {
    id: string;
    timestamp: bigint;
    deletedBy: string;
    groupName: string;
    public: boolean;
};

export type FreezeGroupResponse =
    | EventWrapper<ChatFrozenEvent>
    | "chat_already_frozen"
    | "chat_not_found"
    | "not_authorized"
    | "internal_error";

export type UnfreezeGroupResponse =
    | EventWrapper<ChatUnfrozenEvent>
    | "chat_not_frozen"
    | "chat_not_found"
    | "not_authorized"
    | "internal_error";

export type DeleteFrozenGroupResponse =
    | "success"
    | "chat_not_frozen"
    | "chat_not_frozen_long_enough"
    | "chat_not_found"
    | "not_authorized"
    | "internal_error";

export type MarkPinnedMessagesReadResponse = "success" | "chat_frozen";

export type ClaimPrizeResponse =
    | CallerNotInGroup
    | { kind: "message_not_found" }
    | { kind: "chat_frozen" }
    | { kind: "already_claimed" }
    | { kind: "success" }
    | { kind: "user_suspended" }
    | { kind: "prize_ended" }
    | { kind: "prize_fully_claimed" }
    | { kind: "failed_after_transfer" }
    | { kind: "transfer_failed" };
