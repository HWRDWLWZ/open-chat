<script lang="ts">
    import { onDestroy } from "svelte";
    import { menuStore } from "../stores/menu";
    import { tick } from "svelte";

    export let centered = false;

    let menu: HTMLElement;
    let contextMenu: HTMLElement;

    onDestroy(closeMenu);

    async function showMenu(e: MouseEvent): Promise<void> {
        e.preventDefault();
        if ($menuStore === contextMenu) {
            menuStore.hideMenu();
        } else {
            const rect = menu.getBoundingClientRect();
            menuStore.showMenu(contextMenu);
            tick().then(() => menuStore.position(rect, centered));
        }
    }

    function closeMenu() {
        menuStore.hideMenu();
    }
</script>

<div class="menu-icon" bind:this={menu} on:click|stopPropagation={showMenu}>
    <slot name="icon" />
</div>

<div class="menu-blueprint">
    <span class="menu" bind:this={contextMenu} on:click|stopPropagation={closeMenu}>
        {#if $menuStore === contextMenu}
            <slot name="menu" />
        {/if}
    </span>
</div>

<svelte:body on:click={closeMenu} />
<svelte:window on:resize={closeMenu} on:orientationchange={closeMenu} />

<style type="text/scss">
    .menu {
        position: absolute;
    }

    .menu-blueprint {
        display: none;
    }
</style>
