<script lang="ts">
    import type { Pathname } from "$app/types";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { locales, localizeHref } from "$lib/paraglide/runtime";
    import { m } from "$lib/paraglide/messages";
    import { localeName } from "$lib/i18n";
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";

    import Navigation from "$lib/components/navigation.svelte";
    import Footer from "$lib/components/footer.svelte";

    let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<a href="#content" class="skip">{m["a11y.skip"]()}</a>
<div class="flex min-h-screen flex-col">
    <Navigation />
    <div id="content" class="flex flex-1 flex-col pt-40" tabindex="-1">
        {@render children()}
    </div>
    <Footer />
</div>

<div style="display:none">
    {#each locales as locale (locale)}
        <a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>
            {localeName(locale)}
        </a>
    {/each}
</div>
