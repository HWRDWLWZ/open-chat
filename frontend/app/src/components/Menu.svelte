<script lang="ts">
    import { fade } from "svelte/transition";

    export let centered = false;
</script>

<div transition:fade|local={{ duration: 100 }} class="menu" class:centered>
    <slot />
</div>

<style type="text/scss">
    .menu {
        width: toRem(200);
        position: absolute;
        background-color: var(--menu-bg);
        @include z-index("popup-menu");
        box-shadow: var(--menu-sh);
        border-radius: $sp2;
        border: 1px solid var(--menu-bd);

        @include mobile() {
            &.centered {
                width: 70vw;
            }
        }
    }
</style>
