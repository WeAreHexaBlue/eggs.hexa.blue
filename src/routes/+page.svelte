<script lang="ts">
    import { resolve } from "$app/paths";
    import { m } from "$lib/paraglide/messages";

    import seggs from "$lib/assets/seggs.svg";

    import card0 from "$lib/assets/cards/card0.png";
    import card1 from "$lib/assets/cards/card1.png";
    import card2 from "$lib/assets/cards/card2.png";

    const cards = [
        { src: card0, alt: "Promotional Card 1", href: resolve("/") },
        { src: card1, alt: "Promotional Card 2", href: resolve("/") },
        { src: card2, alt: "Promotional Card 3", href: resolve("/") }
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
    <section class="intro">
        <span class="herosect">
            <h1 class="hero">{m.seggs()}</h1>
            <p class="text-xl">
                A silly <b>content-sharing Discord bot</b> that <b>grows your community</b>!
            </p>
        </span>
        <span class="flex items-center justify-center">
            <img src={seggs} class="egg -rotate-12" alt="Egg" />
            <span class="deck">
                {#each cards as card, i (card.src)}
                    <a
                        href={card.href}
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
</style>