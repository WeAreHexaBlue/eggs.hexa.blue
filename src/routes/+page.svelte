<script lang="ts">
    import { m } from "$lib/paraglide/messages";

    import seggs from "$lib/assets/seggs.svg"

    import card0 from "$lib/assets/cards/card0.png";
</script>

<svelte:head>
    <title>{m.seggs()}</title>
</svelte:head>
<main>
    <section class="intro">
        <span class="herosect">
            <h1 class="hero">{m.seggs()}</h1>
            <p class="text-xl">A silly <b>content-sharing Discord bot</b> that <b>grows your community</b>!</p>
        </span>
        <span class="flex justify-center items-center">
            <img src={seggs} class="egg -rotate-12" alt="Egg" />
            <span class="cards">
                <img src={card0} alt="Promotional Card" />
            </span>
            <img src={seggs} class="egg rotate-12" alt="Egg" />
        </span>
    </section> 
</main>

<style lang="postcss">
    @reference "../base.css";

    .intro {
        @apply grid gap-y-6;
        @apply relative -mt-40 w-full overflow-hidden;
        @apply bg-bpgrad;
        @apply pt-32 sm:pt-42 pb-15;
    }

    .herosect {
        @apply grid gap-4 px-20 sm:px-0;
    }

    .hero {
        @apply text-5xl sm:text-6xl font-extrabold;
    }
    
    .egg {
        @apply hidden lg:block size-100;
    }

    .cards {
        img {
            @apply h-150;
            @apply border border-white rounded-3xl;
        }
    }
</style>