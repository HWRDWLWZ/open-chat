<script lang="ts">
</script>

<div class="blog-post">
    <slot />
</div>

<style type="text/scss">
    :global {
        .blog-post {
            padding-bottom: $sp5;
            border-bottom: 1px solid var(--bd);
            margin-bottom: $sp6;
            h1 {
                @include font(bold, normal, fs-200);
                margin-bottom: $sp4;
            }

            h2 {
                @include font(bold, normal, fs-160);
                margin-bottom: $sp4;
            }

            h3 {
                @include font(bold, normal, fs-120);
                margin-bottom: $sp4;
            }

            p,
            ul {
                @include font(book, normal, fs-100, 28);
                margin-bottom: $sp4;
            }

            ul {
                @include bullet_list();
            }
        }
    }
</style>
