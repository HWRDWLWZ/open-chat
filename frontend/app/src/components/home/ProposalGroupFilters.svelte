<script lang="ts">
    import { createEventDispatcher, getContext } from "svelte";
    import { _ } from "svelte-i18n";
    import Close from "svelte-material-icons/Close.svelte";
    import SectionHeader from "../SectionHeader.svelte";
    import HoverIcon from "../HoverIcon.svelte";
    import { iconSize } from "../../stores/iconSize";
    import { NnsProposalTopic, OpenChat } from "openchat-client";
    import Toggle from "../Toggle.svelte";
    import { mobileWidth } from "../../stores/screenDimensions";
    import LinkButton from "../LinkButton.svelte";

    const client = getContext<OpenChat>("client");
    const dispatch = createEventDispatcher();
    $: proposalTopicsStore = client.proposalTopicsStore;
    $: filteredProposalsStore = client.filteredProposalsStore;

    function close() {
        dispatch("close");
    }
</script>

<SectionHeader shadow flush={$mobileWidth}>
    <h4>{$_("proposal.filter")}</h4>
    <span title={$_("close")} class="close" on:click={close}>
        <HoverIcon>
            <Close size={$iconSize} color={"var(--icon-txt)"} />
        </HoverIcon>
    </span>
</SectionHeader>

<div class="proposal-filters">
    <div class="controls">
        <LinkButton on:click={client.enableAllProposalFilters} underline={"always"}
            >{$_("proposal.enableAll")}</LinkButton>
        <LinkButton
            on:click={() =>
                client.disableAllProposalFilters([...$proposalTopicsStore].map(([id]) => id))}
            underline={"always"}>{$_("proposal.disableAll")}</LinkButton>
    </div>
    {#each [...$proposalTopicsStore] as [id, label]}
        <Toggle
            id={NnsProposalTopic[id]}
            on:change={() => client.toggleProposalFilter(id)}
            {label}
            checked={!$filteredProposalsStore?.hasFilter(id)}
            bigGap />
    {/each}
</div>

<style type="text/scss">
    h4 {
        flex: 1;
        margin: 0;
        text-align: center;
    }
    .close {
        flex: 0 0 30px;
    }
    .proposal-filters {
        background-color: var(--bg);
        padding: $sp4;
        padding-bottom: 0;

        @include mobile() {
            height: 100%;
        }
    }

    .controls {
        display: flex;
        gap: $sp4;
        align-items: center;
        margin-bottom: $sp4;
        text-transform: lowercase;
    }
</style>
