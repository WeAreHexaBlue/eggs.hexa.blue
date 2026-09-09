<script lang="ts">
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { m } from "$lib/paraglide/messages";

    function back(e: MouseEvent) {
        e.preventDefault();
        if (window.history.length > 1) window.history.back();
        else window.location.href = '/';
    }
</script>

<main class="flex flex-col flex-1 justify-center items-center">
    <span class="mb-6">
        <h1 class="font-extrabold text-6xl">
            {page.status}
        </h1>
        <p>
            {page.error?.message}
        </p>
    </span>
    <a href={resolve("/")} onclick={back} class="hover:gradtxt underline text-2xl">
        {m.back()}
    </a>
</main>