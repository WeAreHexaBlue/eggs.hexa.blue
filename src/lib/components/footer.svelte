<script lang="ts">
    import { resolve } from "$app/paths";
    import { m } from "$lib/paraglide/messages";

    import seggsFlat from "$lib/assets/seggs_flat.svg";
    import hbWhite from "$lib/assets/hexablue_white.svg";
</script>

<footer class="footer">
    <span class="flex items-center gap-4">
        <a href={resolve("/")} class="brand">
            <img src={seggsFlat} class="size-15" alt="" />
            <span class="hidden title md:block">{m.seggs()}</span>
        </a>

        <span class="separator" aria-hidden="true"></span>

        <a href="https://hexa.blue/" class="brand">
            <img src={hbWhite} class="size-15" alt="" />
            <span class="hidden font-inter title font-black md:block">{m.hexablue()}</span>
        </a>
    </span>
    <p class="text-gray-300">{@html m["footer.desc"]()}</p>
</footer>

<style lang="postcss">
    @reference "../../base.css";

    .footer {
        @apply mx-auto mt-auto grid w-full;
        @apply justify-items-center gap-y-4;
        @apply rounded-t-4xl bg-mist-800 px-6 py-6 md:px-0;
    }

    .separator {
        @apply h-10 w-px bg-white/20;
    }
</style>
