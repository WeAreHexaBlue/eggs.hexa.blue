<script lang="ts">
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { m } from "$lib/paraglide/messages";
    import { localizedHref } from "$lib/i18n";

    function back(e: MouseEvent) {
        e.preventDefault();
        if (window.history.length > 1) window.history.back();
        else window.location.href = resolve(localizedHref("/"));
    }
</script>

<svelte:head>
    <title>{page.status} - {m.seggs()}</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<main class="flex flex-1 flex-col items-center justify-center">
    <span class="mb-6">
        <h1 class="text-6xl font-extrabold">
            {page.status}
        </h1>
        <p>
            {page.error?.message}
        </p>
    </span>
    <a href={resolve(localizedHref("/"))} onclick={back} class="hover:gradtxt text-2xl underline">
        {m.back()}
    </a>
</main>
