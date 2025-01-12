<svelte:options immutable={true} />

<script lang="ts">
    import { marked } from "marked";
    import { logger } from "../../utils/logging";
    import { getContext } from "svelte";
    import type { OpenChat } from "openchat-client";
    import { DOMPurifyDefault, DOMPurifyOneLine } from "../../utils/domPurify";
    import { isSingleEmoji } from "../../utils/emojis";

    const client = getContext<OpenChat>("client");
    export let text: string;
    export let inline: boolean = true;
    export let oneLine: boolean = false;
    export let suppressLinks: boolean = false;

    let sanitized = "unsafe";

    $: singleEmoji = isSingleEmoji(text);
    $: userStore = client.userStore;
    $: options = {
        breaks: !oneLine,
    };

    function replaceUserIds(text: string): string {
        return text.replace(/@UserId\(([\d\w-]+)\)/g, (match, p1) => {
            const u = $userStore[p1];
            if (u !== undefined) {
                return `**[@${u.username}](#/${u.userId})**`;
            }
            return match;
        });
    }

    $: {
        let parsed = replaceUserIds(text);
        try {
            if (inline) {
                parsed = marked.parseInline(parsed, options);
            } else {
                parsed = marked.parse(parsed, options);
            }
        } catch (err: any) {
            logger.error("Error parsing markdown: ", err);
        }

        const domPurify = oneLine ? DOMPurifyOneLine : DOMPurifyDefault;
        try {
            sanitized = domPurify.sanitize(parsed);
        } catch (err: any) {
            logger.error("Error sanitizing message content: ", err);
        }
    }
</script>

<p class="markdown-wrapper" class:inline class:oneLine class:suppressLinks class:singleEmoji>
    {@html sanitized}
</p>

<style type="text/scss">
    :global {
        .markdown-wrapper {
            h1 {
                @include font-size(fs-120);
            }

            h2 {
                font-size: toRem(19);
                line-height: 125%;
            }

            h3 {
                @include font-size(fs-110);
            }

            h1,
            h2,
            h3,
            h4 {
                font-weight: normal;
                color: var(--markdown-fg-bright);
            }

            h1,
            h2,
            h3,
            h4 {
                margin-top: toRem(24);
                margin-bottom: toRem(16);
                &:first-child {
                    margin-top: 0;
                }
            }

            p,
            ol,
            ul,
            hr,
            blockquote {
                margin-bottom: toRem(16);
                &:last-child {
                    margin-bottom: 0;
                }
            }

            ul,
            ol {
                padding-left: toRem(32);
            }

            ul li {
                list-style-type: disc;
            }

            ul li li {
                list-style-type: circle;
            }

            ul li li li {
                list-style-type: square;
            }

            ol li {
                list-style-type: decimal;
            }

            ol li li {
                list-style-type: lower-alpha;
            }

            ol li li li {
                list-style-type: lower-greek;
            }

            pre,
            code {
                font-family: Menlo, Monaco, "Courier New", monospace;
            }

            pre {
                padding: toRem(12);
                overflow-x: auto;
            }

            blockquote {
                padding: 0 toRem(16);
                border-left: toRem(4) solid var(--bd);
                color: var(--markdown-fg-muted);
            }

            a {
                text-decoration: underline;
            }

            img,
            canvas,
            iframe,
            video,
            svg,
            select,
            textarea {
                max-width: 100%;
            }

            &.suppressLinks {
                a {
                    pointer-events: none;
                    color: inherit;
                }
            }
        }
    }

    .markdown-wrapper:not(:empty) {
        display: inline;

        &:not(.inline) {
            display: block;
        }

        &.oneLine {
            display: block;
            @include ellipsis();
            word-wrap: break-word;
        }
    }

    .singleEmoji:not(.oneLine) {
        display: block;
        text-align: center;
        font-size: 3.5rem;
        line-height: 3.5rem;
        color: var(--markdown-fg-bright);
        @include pop(300ms);
    }
</style>
