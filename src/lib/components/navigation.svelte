<script lang="ts">
    import { resolve } from "$app/paths";
    import { authClient } from "$lib/auth-client";
	import { codeToHuman } from "$lib";

	import { m } from "$lib/paraglide/messages";

	import { fade, fly, slide } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { prefersReducedMotion } from "svelte/motion";

    import logo from "$lib/assets/seggs.svg";

    import { getLocale, locales, setLocale, type Locale } from "$lib/paraglide/runtime";

    const session = authClient.useSession();

    async function login() {
        await authClient.signIn.social({
            provider: "discord",
            callbackURL: resolve("/")
        })
    };

	async function logout() {
		const confirm = window.confirm(m["nav.actions.signout_confirm"]());

		if (confirm) {
			await authClient.signOut({
				fetchOptions: {
                    onSuccess: () => {
                        location.href = "/";
                    }
                }
			})
		}
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
		if (window.innerWidth >= 1280) closeMenu();
	}
</script>

<svelte:window onkeydown={handleKeydown} onresize={handleResize} />

{#snippet brand()}
	<a href={resolve("/")} class="brand" onclick={closeMenu}>
		<img src={logo} class="size-10 sm:size-15" alt="Server Eggs Logo" />
        <h1 class="title hidden sm:inline">{m.seggs()}</h1>
        <h1 class="title sm:hidden">{m.seggs_short()}</h1>
	</a>
{/snippet}

{#snippet links(vertical = false)}
	<span class="links" class:vertical>
		<a href={resolve("/dashboard")} onclick={closeMenu}>{m["nav.dash"]()}</a>
        <a href="https://discord.gg/G9vfEZGZnT" target="_blank" onclick={closeMenu}>{m["nav.support"]()}</a>
        <a href="https://github.com/WeAreHexaBlue/ServerEggs" target="_blank" onclick={closeMenu}>{m["nav.source"]()}</a>
	</span>
{/snippet}

{#snippet sessionManager()}
    {#if $session.isPending}
        <span class="pfp-skeleton" aria-hidden="true" aria-label="Loading..."></span>
    {:else if $session.data?.user}
        <button class="pfp" class:bg-mist-700={!$session.data.user.image} popovertarget="acc-actions">
            {#if $session.data.user.image}
                <img
                    src={$session.data.user.image}
                    alt=""
                    referrerpolicy="no-referrer"
                />
            {:else}
                <span class="" aria-hidden="true">
                    {($session.data.user.name ?? "?").slice(0, 1).toUpperCase()}
                </span>
            {/if}
        </button>

		<div popover id="acc-actions">
			<button class="text-red-400 hover:text-red-500 cursor-pointer" onclick={logout}>{m["nav.actions.signout"]()}</button>
		</div>
    {:else}
        <button class="signin" onclick={login}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="size-5 shrink-0">
                <path
                    d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
                />
            </svg>
            <span class="hidden sm:inline">{m["nav.actions.signin"]()}</span>
            <span class="sm:hidden">{m["nav.actions.signin_short"]()}</span>
        </button>
    {/if}
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
        <span class="actions">
            <span class="desktop-only">
			    {@render langSelector()}
		    </span>

            {@render sessionManager()}

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
        </span>
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
        @apply xl:-translate-y-1 xl:drop-shadow-xl;
    }

	.bar {
		@apply flex w-full items-center justify-between gap-2;
	}

    .nav .main {
        @apply flex items-center gap-8;
    }

	.desktop-only {
		@apply hidden xl:flex items-center;
	}

    .links {
        @apply flex items-center gap-6 text-2xl font-semibold;

        :hover {
            @apply underline;
        }
    }

	.links.vertical {
		@apply flex-col md:grid md:grid-cols-3 gap-4 md:gap-8;
	}

    .actions {
        @apply flex items-center gap-2 sm:gap-3;
    }

    .signin {
        @apply flex items-center gap-2 whitespace-nowrap;
        @apply px-3 sm:px-4 py-2;
        @apply bg-white rounded-full;
        @apply text-blurple-dark font-bold text-sm;
        @apply cursor-pointer border-2 border-transparent;
        @apply transition-all duration-200;

        &:hover {
            @apply scale-[1.03] border-white bg-blurple-light text-blurple-dark shadow-lg;
        }

        &:focus-visible {
            @apply outline-2 outline-offset-2 outline-white;
        }
    }

    .pfp-skeleton {
        @apply border border-white rounded-full bg-mist-700 size-10 sm:size-12;
    }

	#acc-actions {
		@apply m-0 mt-7 md:mt-8;
		@apply px-8 py-4;
		@apply bg-mist-800 text-white;
		@apply rounded-xl;

		position-anchor: --acc-actions;
		position-area: bottom span-left;
		position-try-fallbacks: flip-block;
	}

	.hamburger {
		@apply flex flex-col items-center justify-center rounded-lg p-2 cursor-pointer;
		@apply border border-transparent;
		@apply xl:hidden;
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
		@apply w-fit text-center [text-align-last:center];
	}

    .mobile-panel {
		@apply xl:hidden;
    }

	.mobile-inner {
		@apply grid justify-center content-center gap-5 border-t border-white/20 pt-4;
	}

    .mobile-inner .lang {
        @apply mx-auto;
    }
</style>