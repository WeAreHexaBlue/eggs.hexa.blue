<script lang="ts">
    import { m } from "$lib/paraglide/messages";

    const { data } = $props();

    async function guildButton(guild: typeof data.guilds[0]) {
        if (!guild.hasBot) location.href = guild.oauth
        else location.href = `/dashboard/${guild.id}`
    }
</script>

<svelte:head>
    <title>{m["dashboard.title"]()}</title>
</svelte:head>
<main class="flex flex-col flex-1 justify-center items-center">
    <div class="sect">
        <h1>{m["dashboard.select"]()}</h1>
        <span class="guilds mt-3">
            {#each data.guilds as guild (guild.id)}
                <button
                    class="pfp"
                    class:darkened={!guild.hasBot}
                    onclick={() => guildButton(guild)}
                    aria-label={guild.name}
                >
                    <img src={guild.icon} alt={`${guild.name} Icon`} />
                </button>
            {/each}
        </span>
    </div>
</main>

<style lang="postcss">
    @reference "../../base.css";

    .guilds {
        @apply flex flex-wrap;
        @apply justify-center gap-4 *:size-20;
    }

    .darkened {
        @apply opacity-30;
    }
</style>