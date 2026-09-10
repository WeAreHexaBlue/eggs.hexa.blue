<script lang="ts">
    import { resolve } from "$app/paths";
    import { m } from "$lib/paraglide/messages";

    import seggsFlat from "$lib/assets/seggs_flat.svg";
    import hbWhite from "$lib/assets/hexablue_white.svg";
</script>

<footer class="footer">
    <span class="flex items-center gap-4">
        <a href={resolve("/")} class="brand">
            <img src={seggsFlat} class="size-15" alt="Server Eggs Logo" />
            <h1 class="title hidden md:block">{m.seggs()}</h1>
        </a>

        <span class="separator" aria-hidden="true"></span>

        <a href="https://hexa.blue/" class="brand">
            <img src={hbWhite} class="size-15" alt="HexaBlue Logo" />
            <h1 class="title font-inter font-black hidden md:block">{m.hexablue()}</h1>
        </a>
    </span>
    <p class="text-gray-300">{@html m["footer.desc"]()}</p>
</footer>

<style lang="postcss">
	@reference "../../base.css";

    .footer {
        @apply grid mx-auto mt-auto w-full;
        @apply justify-items-center gap-y-4;
        @apply bg-mist-800 px-6 md:px-0 py-6 rounded-t-4xl;
    }

    .separator {
        @apply h-10 w-px bg-white/20;
    }
</style>