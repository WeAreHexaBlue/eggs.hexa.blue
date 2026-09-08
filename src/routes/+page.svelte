<script lang="ts">
    import { m } from "$lib/paraglide/messages";
</script>

<svelte:head>
    <title>{m.seggs()}</title>
</svelte:head>
<main>
    <div class="intro">
        <span class="herosect">
            <h1 class="hero">{m.seggs()}</h1>
            <p class="text-xl">A silly <b>content-sharing Discord bot</b> that <b>grows your community</b>!</p>
        </span>
    </div>
</main>

<style lang="postcss">
    @reference "../base.css";

    .intro {
        @apply absolute top-0 w-full -z-50 overflow-hidden;
        @apply bg-bpgrad;
        @apply pt-40 sm:pt-50 pb-15;
    }

    .herosect {
        @apply grid gap-4 px-20 sm:px-0;
    }

    .hero {
        @apply text-5xl sm:text-6xl font-extrabold;
    }
</style>