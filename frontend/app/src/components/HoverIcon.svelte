<script lang="ts">
    export let compact: boolean = false;
    export let title: string | undefined = undefined;
    export let disabled: boolean = false;
</script>

<div class="wrapper" class:compact class:disabled role="button" {title}>
    <slot />
</div>

<style type="text/scss">
    .wrapper {
        padding: $sp3;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: transparent;
        transition: background-color ease-in-out 100ms;
        cursor: pointer;

        &.compact {
            padding: $sp2;
        }

        &:not(.disabled):hover {
            background-color: var(--icon-hv);
        }
    }
</style>
