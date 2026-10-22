<script lang="ts">
	import { enhance } from '$app/forms';
	import { codeToHuman } from '$lib';

	import { m } from '$lib/paraglide/messages';

	import type { GuildChannelRatings, GuildRatings, Rating } from '$lib/server/db/bot-schema';

	const { data, form } = $props();

	type OverrideRating = 'safe' | 'questionable' | 'explicit';

	function initForm() {
		return {
			lang: data.settings.lang,
			allowExtLang: data.settings.allowExtLang,
			viewJoinButton: data.settings.viewJoinButton,

			description: data.settings.description ?? '',
			public: Boolean(data.settings.invite),

			ratings: structuredClone(data.settings.ratings) as GuildRatings,
			channelRatings: structuredClone(data.settings.channelRatings) as GuildChannelRatings,

			logch: data.settings.logch ?? '',

			battleTime: data.settings.battleTime
		};
	}

	let formState = $state(initForm());
	let submitting = $state(false);

	function resetForm() {
		formState = initForm();
	}

	const channelRatingOverrides = $derived(
		(['safe', 'questionable', 'explicit'] as const).flatMap((rating) =>
			(formState.channelRatings[rating] ?? []).map((id) => ({ id, rating }))
		)
	);

	const usedOverrides = $derived(new Set(channelRatingOverrides.map((obj) => obj.id)));

	function addOverride() {
		const unused = data.channels.find((c) => c.type === 0 && !usedOverrides.has(c.id));

		if (!unused) return;

		formState.channelRatings.questionable.push(unused.id);
	}

	function removeOverride(cid: string) {
		for (const key of ['safe', 'questionable', 'explicit'] as const) {
			formState.channelRatings[key] = formState.channelRatings[key].filter((id) => id !== cid);
		}
	}

	function changeOverrideChannel(oldcid: string, newcid: string, rating: OverrideRating) {
		removeOverride(oldcid);
		formState.channelRatings[rating].push(newcid);
	}

	function changeOverrideRating(cid: string, oldRating: OverrideRating, newRating: OverrideRating) {
		formState.channelRatings[oldRating] = formState.channelRatings[oldRating].filter(
			(id) => id !== cid
		);
		formState.channelRatings[newRating].push(cid);
	}

	function toggleRating(context: 'normal' | 'nsfw', rating: Rating) {
		const list = formState.ratings[context];
		const idx = list.indexOf(rating);

		if (idx === -1) list.push(rating);
		else if (list.length > 1) list.splice(idx, 1);
	}

	let modified = $derived(
		formState.lang !== data.settings.lang ||
			formState.allowExtLang !== data.settings.allowExtLang ||
			formState.viewJoinButton !== data.settings.viewJoinButton ||
			formState.description !== data.settings.description ||
			formState.public !== Boolean(data.settings.invite) ||
			JSON.stringify(formState.ratings) !== JSON.stringify(data.settings.ratings) ||
			JSON.stringify(formState.channelRatings) !== JSON.stringify(data.settings.channelRatings) ||
			formState.logch !== data.settings.logch ||
			formState.battleTime !== data.settings.battleTime
	);
</script>

<svelte:head>
	<title>{m['dashboard.slug.title']({ name: data.guild.name })}</title>
</svelte:head>
<main>
	<h1 class="grid gap-y-2 title">
		Settings for <span class="text-blurple-light">{data.guild.name}</span>
	</h1>

	{#if form?.message}
		<div>
			{form.message}
		</div>
	{/if}

	<form
		method="POST"
		class="sect settings"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update({ reset: false });
			};
		}}
	>
		<section class="section">
			<span class="section-label">
				<h1>General</h1>
			</span>

			<span class="settings-list">
				<span class="setting-row">
					<span class="setting-info">
						<label for="lang">Language</label>
						<p>The language <b>Server Eggs</b> will use in this server.</p>
					</span>
					<select
						id="lang"
						name="lang"
						bind:value={formState.lang}
						class="rounded-2xl bg-mist-950 p-2"
					>
						{#each Object.entries(codeToHuman) as [code, label] (code)}
							<option value={code}>{label}</option>
						{/each}
					</select>
				</span>
				<span class="setting-row">
					<span class="setting-info">
						<label for="allowExtLang">Allow External Languages</label>
						<p>
							When enabled, allows <b>Server Eggs</b> to respond in a user's set language.<br
							/>Otherwise, enforces the server's language.
						</p>
					</span>
					<input type="checkbox" name="allowExtLang" bind:checked={formState.allowExtLang} />
				</span>
				<span class="setting-row">
					<span class="setting-info">
						<label for="viewJoinButton">Allow <b>Join Origin Server</b> Button on <b>Eggs</b></label
						>
						<p>Allow users to join an <b>Egg</b>'s origin server from a button.</p>
					</span>
					<input type="checkbox" name="viewJoinButton" bind:checked={formState.viewJoinButton} />
				</span>
			</span>
		</section>

		<section class="section">
			<span class="section-label">
				<h1>Global Egg Network</h1>
			</span>

			<span class="settings-list">
				<span class="setting-row">
					<span class="setting-info">
						<label for="public">Public Server</label>
						<p>Allow anyone who sees <b>Eggs</b> from this server to join it.</p>
					</span>
					<input type="checkbox" name="public" bind:checked={formState.public} />
				</span>
				<span class="setting-row">
					<span class="setting-info">
						<label for="description">Server Description</label>
						<p>A short, enticing description to convince people to join your server.</p>
					</span>
					<textarea
						name="description"
						maxlength="300"
						placeholder="Insert a description here..."
						bind:value={formState.description}></textarea>
				</span>
			</span>
		</section>

		<section class="section">
			<span class="section-label">
				<h1>Content Ratings</h1>
			</span>

			<span class="settings-list">
				<span class="setting-row">
					<span class="setting-info">
						<label for="ratings">Allowed Ratings per Channel Type</label>
						<p>Set which content ratings are allowed in each type of channel.</p>
					</span>
					<span>
						<ul>
							<li>
								<label for="normal">Normal Channels</label>
							</li>
						</ul>
					</span>
				</span>
			</span>
		</section>
	</form>
</main>

<style lang="postcss">
	@reference "../../../base.css";

	.settings {
		@apply justify-stretch text-left;

		.section {
			@apply grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10;
			@apply rounded-2xl bg-mist-900 p-6;
			@apply items-start;

			.section-label {
				@apply text-left md:col-span-1;

				h1 {
					@apply text-2xl font-bold text-white;
				}
			}

			.settings-list {
				@apply space-y-4 divide-white/5 text-left md:col-span-2;

				.setting-row {
					@apply grid gap-4 pt-6 first:pt-0 sm:grid-cols-2 sm:items-center;

					.setting-info {
						@apply space-y-1 text-left;

						label {
							@apply block text-base font-medium text-balance text-white;
						}

						p {
							@apply text-sm text-mist-400;
						}
					}

					select,
					input[type='text'],
					textarea,
					input[type='number'] {
						@apply rounded-xl border border-white/10 bg-mist-950 p-2.5 text-sm text-white;
						@apply focus:border-blurple focus:ring-1 focus:ring-blurple focus:outline-none;
					}

					input[type='checkbox'] {
						@apply relative h-6.5 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-mist-950 transition-colors;
						@apply checked:bg-blurple;

						&::after {
							content: '';
							@apply absolute top-0.5 left-0.5 size-5.5 rounded-full bg-white transition-transform;
						}

						&:checked::after {
							@apply translate-x-5.5;
						}
					}
				}
			}
		}
	}
</style>
