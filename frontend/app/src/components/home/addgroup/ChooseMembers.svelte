<script lang="ts">
    import { _ } from "svelte-i18n";
    import SelectUsers from "../SelectUsers.svelte";
    import type { CandidateGroupChat, UserSummary } from "openchat-client";

    export let candidateGroup: CandidateGroupChat;
    export let busy: boolean;

    $: selectedUsers = candidateGroup.members.map((m) => m.user);

    function deleteMember(ev: CustomEvent<UserSummary>): void {
        if (busy) return;
        candidateGroup.members = candidateGroup.members.filter(
            (m) => m.user.userId !== ev.detail.userId
        );
    }

    function addMember(ev: CustomEvent<UserSummary>): void {
        if (busy) return;
        candidateGroup.members = [
            ...candidateGroup.members,
            {
                role: "participant",
                user: ev.detail,
            },
        ];
    }
</script>

<div class="members">
    <SelectUsers
        enabled={!busy}
        mode={"add"}
        on:deleteUser={deleteMember}
        on:selectUser={addMember}
        {selectedUsers} />
</div>
