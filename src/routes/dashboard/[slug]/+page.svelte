<script lang="ts">
    import { m } from "$lib/paraglide/messages";

    const { data } = $props();
</script>

<svelte:head>
    <title>{m["dashboard.slug.title"]({ name: data.guild.name })}</title>
</svelte:head>
