<script lang="ts">
    import { _ } from "svelte-i18n";
    import Overlay from "../../Overlay.svelte";
    import ModalContent from "../../ModalContent.svelte";
    import Features from "./Features.svelte";
    import Payment from "./Payment.svelte";
    import { Cryptocurrency, cryptoLookup, OpenChat } from "openchat-client";
    import { getContext } from "svelte";
    import BalanceWithRefresh from "../BalanceWithRefresh.svelte";

    const client = getContext<OpenChat>("client");
    const token: Cryptocurrency = "icp";

    let step: "features" | "payment" = "features";
    let error: string | undefined;
    let confirming = false;
    let confirmed = false;
    let refreshingBalance = false;

    $: isDiamond = client.isDiamond;
    $: cryptoBalance = client.cryptoBalance;
    $: tokenDetails = {
        key: token,
        symbol: cryptoLookup[token].symbol,
        balance: $cryptoBalance[token],
        disabled: cryptoLookup[token].disabled,
    };

    function onBalanceRefreshed() {
        error = undefined;
    }

    function onBalanceRefreshError(ev: CustomEvent<string>) {
        error = ev.detail;
    }
</script>

<Overlay>
    <ModalContent hideFooter fill>
        <span class="header" slot="header">
            {#if !confirming && !confirmed}
                <div class="title">
                    {#if step === "features"}
                        {#if $isDiamond}
                            {$_("upgrade.benefits")}
                        {:else}
                            {$_("upgrade.featuresTitle")}
                        {/if}
                    {:else if step === "payment"}
                        {$_("upgrade.paymentTitle")}
                    {/if}
                </div>
                {#if step === "payment"}
                    <div class="balance">
                        <BalanceWithRefresh
                            token={tokenDetails.key}
                            value={tokenDetails.balance}
                            bind:refreshing={refreshingBalance}
                            on:refreshed={onBalanceRefreshed}
                            on:error={onBalanceRefreshError} />
                    </div>
                {/if}
            {/if}
        </span>
        <span slot="body">
            {#if step === "features"}
                <Features isDiamond={$isDiamond} on:cancel on:upgrade={() => (step = "payment")} />
            {/if}
            {#if step === "payment"}
                <Payment
                    bind:confirmed
                    bind:confirming
                    bind:refreshingBalance
                    {error}
                    accountBalance={Number(tokenDetails.balance)}
                    on:cancel
                    on:features={() => (step = "features")} />
            {/if}
        </span>
    </ModalContent>
</Overlay>

<style type="text/scss">
    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
</style>
