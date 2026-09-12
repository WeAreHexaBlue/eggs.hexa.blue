<script lang="ts">
    import { codeToHuman } from "$lib";

    import { m } from "$lib/paraglide/messages";

    const { data } = $props();
</script>

<svelte:head>
    <title>{m["dashboard.slug.title"]({ name: data.guild.name })}</title>
</svelte:head>
<main>
    <h1 class="title">Settings for {data.guild.name}</h1>
</main>