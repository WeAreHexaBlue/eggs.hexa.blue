<script lang="ts">
    import { m } from "$lib/paraglide/messages";

    const { data } = $props();
</script>

<svelte:head>
    <title>{m["dashboard.title"]()}</title>
</svelte:head>
<main class="flex flex-1 flex-col items-center justify-center">
    <div class="sect">
        <h1>{m["dashboard.select"]()}</h1>

        {#if data.guilds.length > 0}
            <ul class="guilds mt-3">
                {#each data.guilds as guild (guild.id)}
                    <li>
                        <a
                            class="guild"
                            class:missing={!guild.hasBot}
                            href={guild.href}
                            aria-label={guild.hasBot
                                ? m["dashboard.openGuild"]({ name: guild.name })
                                : m["dashboard.addGuild"]({ name: guild.name })}
                        >
                            <span class="guild-icon" aria-hidden="true">
                                {#if guild.icon}
                                    <img src={guild.icon} alt="" />
                                {:else}
                                    {guild.name.slice(0, 1).toUpperCase()}
                                {/if}
                            </span>
                            <span class="guild-name">{guild.name}</span>
                            <span class="guild-badge" class:installed={guild.hasBot}>
                                {guild.hasBot
                                    ? m["dashboard.botPresent"]()
                                    : m["dashboard.botMissing"]()}
                            </span>
                        </a>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="mt-3">{m["dashboard.noGuilds"]()}</p>
        {/if}

        <a class="add-bot" href={data.addBotUrl}>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
            >
                <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
            {m["dashboard.addBot"]()}
        </a>
    </div>
</main>

<style lang="postcss">
    @reference "../../base.css";

    .guilds {
        @apply flex flex-wrap justify-center gap-4;
        @apply list-none p-0;

        li {
            @apply list-none;
        }
    }

    .guild {
        @apply flex flex-col items-center gap-2;
        @apply w-36 rounded-2xl border border-white/10 bg-mist-900 p-4;
        @apply transition-all duration-200;

        &:hover,
        &:focus-visible {
            @apply scale-105 border-white/40 bg-mist-950;
        }

        &:focus-visible {
            @apply outline-2 outline-offset-2 outline-white;
        }
    }

    .guild.missing {
        @apply opacity-60;

        &:hover,
        &:focus-visible {
            @apply opacity-100;
        }
    }

    .guild-icon {
        @apply flex items-center justify-center;
        @apply size-16 overflow-hidden rounded-full;
        @apply bg-mist-700 text-2xl font-bold;

        img {
            @apply size-full object-cover;
        }
    }

    .guild-name {
        @apply w-full truncate text-sm font-semibold;
    }

    .guild-badge {
        @apply rounded-full px-2 py-0.5 text-xs;
        @apply bg-amber-400/15 text-amber-200;
    }

    .guild-badge.installed {
        @apply bg-emerald-400/15 text-emerald-200;
    }

    .add-bot {
        @apply mt-6 inline-flex items-center justify-center gap-2 justify-self-center;
        @apply rounded-xl border border-white/15 px-4 py-2;
        @apply text-sm font-semibold transition-colors;

        &:hover,
        &:focus-visible {
            @apply border-white/40 bg-mist-900;
        }

        svg {
            @apply size-4;
        }
    }
</style>
