<script lang="ts">
    import { resolve } from "$app/paths";
	import { m } from "$lib/paraglide/messages";

	import { fade, fly, slide } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { prefersReducedMotion } from "svelte/motion";

    import logo from "$lib/assets/seggs.svg";

    import { getLocale, locales, setLocale, type Locale } from "$lib/paraglide/runtime";

    let codeToHuman = {
        en: "English",
        it: "Italiano"
    };

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") closeMenu();
	}

	function handleResize() {
		if (window.innerWidth >= 1024) closeMenu();
	}
</script>

<svelte:window onkeydown={handleKeydown} onresize={handleResize} />

{#snippet brand()}
	<a href={resolve("/")} class="brand" onclick={closeMenu}>
		<img src={logo} class="size-10 sm:size-15" alt="Server Eggs Logo" />
		<h1 class="title">{m.seggs()}</h1>
	</a>
{/snippet}

{#snippet links(vertical = false)}
	<span class="links" class:vertical>
		<a href={resolve("/dashboard")} onclick={closeMenu}>{m["nav.dash"]()}</a>
        <a href="https://discord.gg/G9vfEZGZnT" target="_blank" onclick={closeMenu}>{m["nav.support"]()}</a>
        <a href="https://github.com/WeAreHexaBlue/ServerEggs" target="_blank" onclick={closeMenu}>{m["nav.source"]()}</a>
	</span>
{/snippet}

{#snippet langSelector()}
	<select
		name="lang"
		class="rounded-md lang"
		aria-label="Language"
		onchange={(e) => setLocale(e.currentTarget.value as Locale)}
	>
		{#each locales as locale (locale)}
			<option value={locale} class="bg-neutral-900 text-white" selected={getLocale() === locale}>
				{codeToHuman[locale]}
			</option>
		{/each}
	</select>
{/snippet}

<nav class="nav" in:fly={{ y: -12, duration: prefersReducedMotion.current ? 0 : 220, easing: cubicOut }}>
	<div class="bar">
		<span class="main">
			{@render brand()}
			<span class="desktop-only">
				{@render links()}
			</span>
		</span>
		<span class="desktop-only">
			{@render langSelector()}
		</span>

		<!-- Hamburger icon (or X) -->
		<button
			class="hamburger"
			aria-label={menuOpen ? "Close menu" : "Open menu"}
			aria-expanded={menuOpen}
			aria-controls="mobile-menu"
			onclick={toggleMenu}
		>
			<span class="ham-line ham-line-1" aria-hidden="true"></span>
			<span class="ham-line ham-line-2" aria-hidden="true"></span>
			<span class="ham-line ham-line-3" aria-hidden="true"></span>
		</button>
	</div>
	{#if menuOpen}
		<div
			id="mobile-menu"
			class="mobile-panel"
			in:slide={{ duration: prefersReducedMotion.current ? 0 : 300, easing: cubicOut }}
			out:slide={{
				duration: prefersReducedMotion.current ? 0 : 250,
				delay: prefersReducedMotion.current ? 0 : 60,
				easing: cubicOut
			}}
		>
			<div
				class="mobile-inner"
				in:fade|global={{
					delay: prefersReducedMotion.current ? 0 : 120,
					duration: prefersReducedMotion.current ? 0 : 200
				}}
				out:fade|global={{ duration: prefersReducedMotion.current ? 0 : 120 }}
			>
				{@render links(true)}
				{@render langSelector()}
			</div>
		</div>
	{/if}
</nav>

<style lang="postcss">
	@reference "../../base.css";

    .nav {
        @apply fixed inset-x-0 z-50 mx-auto;
        @apply m-4 sm:m-8 rounded-xl border border-gray-300 p-4;
        @apply bg-blurple;
		@apply flex flex-col items-stretch gap-2;

        @apply transition-all duration-300;
    }

    .nav:hover {
        @apply border-white;
        @apply lg:-translate-y-1 lg:drop-shadow-xl;
    }

	.bar {
		@apply flex w-full items-center justify-between gap-2;
	}

    .nav .main {
        @apply flex items-center gap-8;
    }

	.desktop-only {
		@apply hidden lg:flex items-center;
	}

    .links {
        @apply flex items-center gap-6 text-lg sm:text-2xl font-semibold;

        :hover {
            @apply underline;
        }
    }

	.links.vertical {
		@apply flex-col gap-4 text-2xl;
	}

	.hamburger {
		@apply flex flex-col items-center justify-center rounded-lg p-2 cursor-pointer;
		@apply border border-transparent;
		@apply lg:hidden;
		width: 2.75rem;
		height: 2.75rem;

		--ham-line: 2px;
		--ham-gap: 6px;
		--ham-shift: calc(var(--ham-line) + var(--ham-gap));
		gap: var(--ham-gap);

		&:hover {
			@apply border-white;
		}

		&[aria-expanded="true"] {
			.ham-line-1 {
				transform: translateY(var(--ham-shift)) rotate(45deg);
			}

			.ham-line-2 {
				opacity: 0;
			}

			.ham-line-3 {
				transform: translateY(calc(var(--ham-shift) * -1)) rotate(-45deg);
			}
		}
	}

	.ham-line {
		display: block;
		width: 1.5rem;
		height: var(--ham-line);
		border-radius: 9999px;
		background: currentColor;
		transition:
			transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 200ms ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.ham-line {
			transition: none;
		}
	}

	.lang {
		@apply w-fit;
	}

	.mobile-inner .lang {
		@apply mx-auto;
	}

    .mobile-panel {
		@apply lg:hidden;
    }

	.mobile-inner {
		@apply flex flex-col items-stretch gap-5 border-t border-white/20 pt-4;
	}
</style>