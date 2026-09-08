<script lang="ts">
    import { resolve } from "$app/paths";
    import { m } from "$lib/paraglide/messages";

    import seggs from "$lib/assets/seggs.svg";

    import card0 from "$lib/assets/cards/card0.png";
    import card1 from "$lib/assets/cards/card1.png";
    import card2 from "$lib/assets/cards/card2.png";

    const cards = [
        { src: card0, alt: "Promotional Card 1" },
        { src: card1, alt: "Promotional Card 2" },
        { src: card2, alt: "Promotional Card 3" }
    ];

    let raised = $state<number | null>(null);

    function handleCardClick(event: MouseEvent, index: number) {
        if (window.matchMedia("(hover: none)").matches && raised !== index) {
            event.preventDefault();
            raised = index;
            (event.currentTarget as HTMLAnchorElement).focus();
        }
    }
</script>

<svelte:head>
    <title>{m.seggs()}</title>
</svelte:head>
<main>
    {#snippet ctabtn()}
        <button id="cta" onclick={() => window.open("https://discord.com/discovery/applications/886686500845138041", "_blank")}>
            {@html m["home.cta.button"]()}
        </button>
    {/snippet}

    <section class="intro">
        <span class="herosect">
            <h1 class="hero">{m.seggs()}</h1>
            <p class="text-lg sm:text-xl">
                {@html m["home.hero"]()}
            </p>
            {@render ctabtn()}
        </span>
        <span class="flex items-center justify-center">
            <img src={seggs} class="egg -rotate-12" alt="Egg" />
            <span class="deck">
                {#each cards as card, i (card.src)}
                    <a
                        href={resolve("/#features")}
                        class="card"
                        class:raised={raised === i}
                        style:--slot={i + 1}
                        aria-label={card.alt}
                        onclick={(e) => handleCardClick(e, i)}
                        onblur={() => {
                            if (raised === i) raised = null;
                        }}
                    >
                        <img src={card.src} alt={card.alt} />
                    </a>
                {/each}
            </span>
            <img src={seggs} class="egg rotate-12" alt="Egg" />
        </span>
    </section>

    <section id="about" class="sect">
        <h1>{m["home.about.title"]()}</h1>
        <p>{@html m["home.about.desc"]()}</p>
    </section>

    <section id="features" class="sect">
        <h1>{m["home.features.title"]()}</h1>
        <span class="spangrid grid-cols-1 xl:grid-cols-3">
            <span>
                <h1>{m["home.features.fun.title"]()}</h1>
                <p>{@html m["home.features.fun.desc"]()}</p>
            </span>
            <span>
                <h1>{m["home.features.customizable.title"]()}</h1>
                <p>{@html m["home.features.customizable.desc"]()}</p>
            </span>
            <span>
                <h1>{m["home.features.friendly.title"]()}</h1>
                <p>{@html m["home.features.friendly.desc"]()}</p>
            </span>
            <span>
                <h1>{m["home.features.mod.title"]()}</h1>
                <p>{@html m["home.features.mod.desc"]()}</p>
            </span>
            <span>
                <h1>{m["home.features.extras.title"]()}</h1>
                <p>{@html m["home.features.extras.desc"]()}</p>
            </span>
            <span>
                <h1>{m["home.features.premium.title"]()}</h1>
                <p>{@html m["home.features.premium.desc"]()}</p>
            </span>
        </span>
    </section>

    <section class="sect">
        <h1>{m["home.cta.title"]()}</h1>
        {@render ctabtn()}
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
        @apply grid gap-4 px-10 sm:px-0;
    }

    .hero {
        @apply text-4xl sm:text-6xl font-extrabold;
    }

    .egg {
        @apply hidden lg:block size-100;
    }

    .deck {
        @apply flex items-end justify-center;
        @apply px-4 sm:px-6 pt-12 pb-4;
    }

    .card {
        @apply block overflow-hidden rounded-3xl border border-white;
        @apply shrink-0 origin-bottom;

        z-index: var(--slot);

        img {
            @apply block h-56 sm:h-72 lg:h-80 xl:h-96 w-auto;
        }

        & + & {
            @apply -ml-12 sm:-ml-14;
        }

        &:nth-child(1) {
            transform: rotate(-10deg) translateY(0.75rem);
        }
        &:nth-child(2) {
            transform: rotate(0deg);
        }
        &:nth-child(3) {
            transform: rotate(10deg) translateY(0.75rem);
        }

        box-shadow: 0 12px 24px rgb(0 0 0 / 0.35);
        transition:
            transform 0.35s ease,
            box-shadow 0.35s ease;

        &:hover,
        &:focus-visible,
        &:focus-within,
        &.raised {
            transform: rotate(0deg) translateY(-1.5rem) scale(1.05);
            z-index: 10;
            box-shadow: 0 28px 56px rgb(0 0 0 / 0.45);
        }

        &:focus-visible {
            @apply outline-3 outline-offset-4 outline-white;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .card {
            transition: none;
        }
    }

    #cta {
        @apply bg-blurple hover:bg-blurple-dark mt-3 md:mt-6 p-4 sm:p-6 w-fit justify-self-center;
        @apply rounded-2xl border border-transparent hover:border-white;
        @apply text-2xl;
        @apply transition-transform duration-200 hover:scale-105;
        @apply cursor-pointer;
    }
</style>