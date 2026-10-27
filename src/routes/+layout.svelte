<script lang="ts">
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";

    import Navigation from "$lib/components/navigation.svelte";
    import Footer from "$lib/components/footer.svelte";
    import Seo from "$lib/components/seo.svelte";

    let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Seo />
<div class="flex min-h-screen flex-col">
    <Navigation />
    <div class="flex flex-1 flex-col pt-40">
        {@render children()}
    </div>
    <Footer />
</div>
