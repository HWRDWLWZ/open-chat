<script lang="ts">
    import type { CandidateGroupChat } from "openchat-client";
    import { _ } from "svelte-i18n";
    import EditableAvatar from "../../EditableAvatar.svelte";
    import Input from "../../Input.svelte";
    import TextArea from "../../TextArea.svelte";
    import FormField from "./FormField.svelte";

    const MIN_LENGTH = 3;
    const MAX_LENGTH = 25;
    const MAX_DESC_LENGTH = 1024;

    export let busy: boolean;
    export let candidateGroup: CandidateGroupChat;

    function groupAvatarSelected(ev: CustomEvent<{ url: string; data: Uint8Array }>) {
        candidateGroup.avatar = {
            blobUrl: ev.detail.url,
            blobData: ev.detail.data,
        };
    }
</script>

<FormField label={"Group Image"}>
    <div class="photo">
        <EditableAvatar
            overlayIcon
            image={candidateGroup.avatar?.blobUrl}
            on:imageSelected={groupAvatarSelected} />
    </div>
</FormField>
<FormField label={"Group name"} required>
    <Input
        autofocus
        disabled={busy}
        bind:value={candidateGroup.name}
        minlength={MIN_LENGTH}
        maxlength={MAX_LENGTH}
        countdown
        placeholder={$_("newGroupName")} />
</FormField>
<FormField label={"Description"}>
    <TextArea
        rows={4}
        disabled={busy}
        bind:value={candidateGroup.description}
        maxlength={MAX_DESC_LENGTH}
        placeholder={$_("newGroupDesc")} />
</FormField>

<style type="text/scss">
    .photo {
        text-align: center;
        padding: $sp4 0;
        margin-bottom: $sp3;
    }
</style>
