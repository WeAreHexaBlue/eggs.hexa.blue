<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';

	import { RATINGS, botLocales, codeToHuman, isBotLocale } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import type { GuildChannelRatings, GuildRatings, Rating } from '$lib/server/db/bot-schema';
	import type { ChannelRatingKey } from '$lib/server/guild-settings';

	const { data, form } = $props();

	type RatingContext = 'normal' | 'nsfw';

	const CHANNEL_RATINGS: ChannelRatingKey[] = ['safe', 'questionable', 'explicit'];
	const RATING_CONTEXTS: RatingContext[] = ['normal', 'nsfw'];
	const NORMAL_RATINGS = RATINGS.filter((rating) => rating !== 'EXPLICIT');

	const RATING_LABELS: Record<Rating, () => string> = {
		SAFE: m['dashboard.slug.ratings.safe'],
		QUESTIONABLE: m['dashboard.slug.ratings.questionable'],
		EXPLICIT: m['dashboard.slug.ratings.explicit']
	};

	const RATING_CONTEXT_LABELS: Record<RatingContext, () => string> = {
		normal: m['dashboard.slug.ratings.normal'],
		nsfw: m['dashboard.slug.ratings.nsfw']
	};

	const errorMessages: Record<string, () => string> = {
		unauthorized: m['dashboard.slug.errors.unauthorized'],
		not_found: m['dashboard.slug.errors.not_found'],
		bot_missing: m['dashboard.slug.errors.bot_missing'],
		invalid_lang: m['dashboard.slug.errors.invalid_lang'],
		invalid_ratings: m['dashboard.slug.errors.invalid_ratings'],
		explicit_normal: m['dashboard.slug.errors.explicit_normal'],
		invalid_channel_ratings: m['dashboard.slug.errors.invalid_channel_ratings'],
		invalid_logch: m['dashboard.slug.errors.invalid_logch'],
		invalid_battle_time: m['dashboard.slug.errors.invalid_battle_time'],
		invite_failed: m['dashboard.slug.errors.invite_failed'],
		save_failed: m['dashboard.slug.errors.save_failed'],
		unknown: m['dashboard.slug.errors.unknown']
	};

	let formState = $state(initForm());
	let submitting = $state(false);

	const textChannels = $derived(
		data.channels.filter((channel) => channel.type === 0 || channel.type === 5)
	);

	const channelRatingOverrides = $derived(
		CHANNEL_RATINGS.flatMap((rating) =>
			formState.channelRatings[rating].map((id) => ({ id, rating }))
		)
	);

	const usedOverrides = $derived(new Set(channelRatingOverrides.map((entry) => entry.id)));

	const hasUnusedChannel = $derived(textChannels.some((channel) => !usedOverrides.has(channel.id)));

	const descriptionLength = $derived(formState.description.length);

	const currentLangIsSupported = $derived(isBotLocale(formState.lang));

	let modified = $derived(
		formState.lang !== data.settings.lang ||
			formState.allowExtLang !== data.settings.allowExtLang ||
			formState.viewJoinButton !== data.settings.viewJoinButton ||
			formState.description.trim() !== data.settings.description.trim() ||
			formState.public !== data.settings.public ||
			ratingsKey(formState.ratings) !== ratingsKey(data.settings.ratings) ||
			channelRatingsKey(formState.channelRatings) !==
				channelRatingsKey(data.settings.channelRatings) ||
			formState.logch !== data.settings.logch ||
			formState.battleTime !== data.settings.battleTime
	);

	function initForm() {
		return {
			lang: data.settings.lang,
			allowExtLang: data.settings.allowExtLang,
			viewJoinButton: data.settings.viewJoinButton,
			description: data.settings.description,
			public: data.settings.public,
			ratings: structuredClone(data.settings.ratings) as GuildRatings,
			channelRatings: structuredClone(data.settings.channelRatings) as GuildChannelRatings,
			logch: data.settings.logch,
			battleTime: data.settings.battleTime
		};
	}

	function resetForm() {
		formState = initForm();
	}

	function channelName(channel: { name: string; parentId: string | null }): string {
		const parent = channel.parentId
			? data.channels.find((entry) => entry.id === channel.parentId)
			: null;

		return parent ? `${parent.name} / #${channel.name}` : `#${channel.name}`;
	}

	function channelLabel(id: string): string {
		const channel = data.channels.find((entry) => entry.id === id);

		return channel ? channelName(channel) : m['dashboard.slug.channels.unknown']({ id });
	}

	function channelRatingLabel(rating: ChannelRatingKey): string {
		return RATING_LABELS[rating.toUpperCase() as Rating]();
	}

	function isUsedElsewhere(id: string, except: string): boolean {
		return id !== except && usedOverrides.has(id);
	}

	function addOverride() {
		const unused = textChannels.find((channel) => !usedOverrides.has(channel.id));

		if (!unused) return;

		formState.channelRatings.questionable = [...formState.channelRatings.questionable, unused.id];
	}

	function removeOverride(id: string) {
		for (const rating of CHANNEL_RATINGS) {
			formState.channelRatings[rating] = formState.channelRatings[rating].filter(
				(entry) => entry !== id
			);
		}
	}

	function changeOverrideChannel(oldId: string, newId: string, rating: ChannelRatingKey) {
		if (oldId === newId || usedOverrides.has(newId)) return;

		removeOverride(oldId);

		if (!formState.channelRatings[rating].includes(newId)) {
			formState.channelRatings[rating] = [...formState.channelRatings[rating], newId];
		}
	}

	function changeOverrideRating(
		id: string,
		oldRating: ChannelRatingKey,
		newRating: ChannelRatingKey
	) {
		if (oldRating === newRating) return;

		formState.channelRatings[oldRating] = formState.channelRatings[oldRating].filter(
			(entry) => entry !== id
		);

		if (!formState.channelRatings[newRating].includes(id)) {
			formState.channelRatings[newRating] = [...formState.channelRatings[newRating], id];
		}
	}

	function toggleRating(context: RatingContext, rating: Rating) {
		const current = formState.ratings[context];

		if (current.includes(rating)) {
			if (current.length > 1) {
				formState.ratings[context] = current.filter((entry) => entry !== rating);
			}

			return;
		}

		formState.ratings[context] = [...current, rating];
	}

	function ratingsKey(ratings: GuildRatings): string {
		return RATING_CONTEXTS.map((context) =>
			[...ratings[context]].sort((a, b) => RATINGS.indexOf(a) - RATINGS.indexOf(b)).join(',')
		).join('|');
	}

	function channelRatingsKey(ratings: GuildChannelRatings): string {
		return CHANNEL_RATINGS.map((rating) => [...ratings[rating]].sort().join(',')).join('|');
	}

	function errorText(code: string): string {
		return (errorMessages[code] ?? errorMessages.unknown)();
	}
</script>

<svelte:head>
	<title>{m['dashboard.slug.title']({ name: data.guild.name })}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<header class="settings-header">
		{#if data.guild.icon}
			<img class="guild-icon" src={data.guild.icon} alt="" />
		{/if}
		<h1 class="title">
			{m['dashboard.slug.heading']()}
			<span class="text-blurple-light">{data.guild.name}</span>
		</h1>
	</header>

	<form
		method="POST"
		class="sect settings"
		class:busy={submitting}
		use:enhance={() => {
			submitting = true;

			return async ({ result, update }) => {
				try {
					await update({ reset: false });

					if (result.type === 'success') {
						await tick();
						formState = initForm();
					}
				} finally {
					submitting = false;
				}
			};
		}}
	>
		{#if form?.ok && !modified}
			<div class="alert success" role="status">{m['dashboard.slug.saved']()}</div>
		{:else if form?.error}
			<div class="alert error" role="alert">{errorText(form.error)}</div>
		{/if}

		<section class="section">
			<div class="section-label">
				<h2>{m['dashboard.slug.general.title']()}</h2>
			</div>

			<div class="settings-list">
				<div class="setting-row">
					<div class="setting-info">
						<label for="lang">{m['dashboard.slug.general.lang.title']()}</label>
						<p>{m['dashboard.slug.general.lang.desc']()}</p>
					</div>
					<select id="lang" name="lang" bind:value={formState.lang}>
						{#if !currentLangIsSupported}
							<option value={formState.lang} disabled>
								{m['dashboard.slug.general.lang.unsupported']({ lang: formState.lang })}
							</option>
						{/if}
						{#each botLocales as locale (locale)}
							<option value={locale}>{codeToHuman[locale]}</option>
						{/each}
					</select>
				</div>

				<div class="setting-row">
					<div class="setting-info">
						<label for="allowExtLang">{m['dashboard.slug.general.allowExtLang.title']()}</label>
						<p>{m['dashboard.slug.general.allowExtLang.desc']()}</p>
					</div>
					<input
						class="switch"
						type="checkbox"
						id="allowExtLang"
						name="allowExtLang"
						bind:checked={formState.allowExtLang}
					/>
				</div>

				<div class="setting-row">
					<div class="setting-info">
						<label for="viewJoinButton">
							{m['dashboard.slug.general.viewJoinButton.title']()}
						</label>
						<p>{m['dashboard.slug.general.viewJoinButton.desc']()}</p>
					</div>
					<input
						class="switch"
						type="checkbox"
						id="viewJoinButton"
						name="viewJoinButton"
						bind:checked={formState.viewJoinButton}
					/>
				</div>
			</div>
		</section>

		<section class="section">
			<div class="section-label">
				<h2>{m['dashboard.slug.network.title']()}</h2>
			</div>

			<div class="settings-list">
				<div class="setting-row">
					<div class="setting-info">
						<label for="public">{m['dashboard.slug.network.public.title']()}</label>
						<p>{m['dashboard.slug.network.public.desc']()}</p>
					</div>
					<input
						class="switch"
						type="checkbox"
						id="public"
						name="public"
						bind:checked={formState.public}
					/>
				</div>

				<div class="setting-row">
					<div class="setting-info">
						<label for="description">{m['dashboard.slug.network.description.title']()}</label>
						<p>{m['dashboard.slug.network.description.desc']()}</p>
					</div>
					<div class="field">
						<textarea
							id="description"
							name="description"
							maxlength="300"
							rows="4"
							placeholder={m['dashboard.slug.network.description.placeholder']()}
							bind:value={formState.description}></textarea>
						<span class="hint">
							{m['dashboard.slug.network.characters']({ count: descriptionLength })}
						</span>
					</div>
				</div>
			</div>
		</section>

		<section class="section">
			<div class="section-label">
				<h2>{m['dashboard.slug.ratings.title']()}</h2>
				<p class="section-desc">{m['dashboard.slug.ratings.desc']()}</p>
			</div>

			<div class="settings-list">
				<div class="ratings-grid">
					{#each RATING_CONTEXTS as context (context)}
						<fieldset class="rating-group">
							<legend>{RATING_CONTEXT_LABELS[context]()}</legend>
							{#each context === 'normal' ? NORMAL_RATINGS : RATINGS as rating (rating)}
								<label class="rating-option">
									<input
										type="checkbox"
										name={`ratings.${context}`}
										value={rating}
										checked={formState.ratings[context].includes(rating)}
										onchange={() => toggleRating(context, rating)}
									/>
									<span>{RATING_LABELS[rating]()}</span>
								</label>
							{/each}
						</fieldset>
					{/each}
				</div>
				<p class="hint">{m['dashboard.slug.ratings.atLeastOne']()}</p>
			</div>
		</section>

		<section class="section">
			<div class="section-label">
				<h2>{m['dashboard.slug.channels.title']()}</h2>
				<p class="section-desc">{m['dashboard.slug.channels.desc']()}</p>
			</div>

			<div class="settings-list">
				{#if textChannels.length === 0}
					<p class="hint">{m['dashboard.slug.channels.noChannels']()}</p>
				{:else if channelRatingOverrides.length === 0}
					<p class="hint">{m['dashboard.slug.channels.none']()}</p>
				{:else}
					<ul class="override-list">
						{#each channelRatingOverrides as override (override.id)}
							<li class="override-row">
								<select
									aria-label={m['dashboard.slug.channels.channel']()}
									value={override.id}
									onchange={(event) =>
										changeOverrideChannel(override.id, event.currentTarget.value, override.rating)}
								>
									{#each textChannels as channel (channel.id)}
										<option value={channel.id} disabled={isUsedElsewhere(channel.id, override.id)}>
											{channelName(channel)}
										</option>
									{/each}
								</select>

								<select
									aria-label={m['dashboard.slug.channels.rating']()}
									value={override.rating}
									onchange={(event) =>
										changeOverrideRating(
											override.id,
											override.rating,
											event.currentTarget.value as ChannelRatingKey
										)}
								>
									{#each CHANNEL_RATINGS as rating (rating)}
										<option value={rating}>{channelRatingLabel(rating)}</option>
									{/each}
								</select>

								<button
									type="button"
									class="remove"
									aria-label={m['dashboard.slug.channels.remove']({
										channel: channelLabel(override.id)
									})}
									onclick={() => removeOverride(override.id)}
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										aria-hidden="true"
									>
										<path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
									</svg>
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				<button
					type="button"
					class="add-override"
					disabled={!hasUnusedChannel}
					onclick={addOverride}
				>
					{m['dashboard.slug.channels.add']()}
				</button>

				<p class="hint">{m['dashboard.slug.channels.note']()}</p>
			</div>
		</section>

		<section class="section">
			<div class="section-label">
				<h2>{m['dashboard.slug.logging.title']()}</h2>
				<p class="section-desc">{m['dashboard.slug.logging.desc']()}</p>
			</div>

			<div class="settings-list">
				<div class="setting-row">
					<div class="setting-info">
						<label for="logch">{m['dashboard.slug.logging.logch.title']()}</label>
						<p>{m['dashboard.slug.logging.logch.desc']()}</p>
					</div>
					<select id="logch" name="logch" bind:value={formState.logch}>
						<option value="">{m['dashboard.slug.logging.none']()}</option>
						{#if formState.logch && !textChannels.some((channel) => channel.id === formState.logch)}
							<option value={formState.logch}>
								{m['dashboard.slug.channels.unknown']({ id: formState.logch })}
							</option>
						{/if}
						{#each textChannels as channel (channel.id)}
							<option value={channel.id}>{channelName(channel)}</option>
						{/each}
					</select>
				</div>
			</div>
		</section>

		<section class="section">
			<div class="section-label">
				<h2>{m['dashboard.slug.battles.title']()}</h2>
			</div>

			<div class="settings-list">
				<div class="setting-row">
					<div class="setting-info">
						<label for="battleTime">{m['dashboard.slug.battles.time.title']()}</label>
						<p>{m['dashboard.slug.battles.time.desc']()}</p>
					</div>
					<div class="field inline">
						<input
							id="battleTime"
							name="battleTime"
							type="number"
							min="1"
							max="1000000"
							step="1"
							required
							bind:value={formState.battleTime}
						/>
						<span>{m['dashboard.slug.battles.minutes']()}</span>
					</div>
				</div>
			</div>
		</section>

		<input type="hidden" name="channelRatings" value={JSON.stringify(formState.channelRatings)} />

		<div class="savebar">
			<span class="save-status">
				{#if submitting}
					{m['dashboard.slug.saving']()}
				{:else if modified}
					{m['dashboard.slug.unsaved']()}
				{/if}
			</span>
			<span class="save-actions">
				<button
					type="button"
					class="secondary"
					disabled={!modified || submitting}
					onclick={resetForm}
				>
					{m['dashboard.slug.reset']()}
				</button>
				<button type="submit" class="primary" disabled={!modified || submitting}>
					{m['dashboard.slug.save']()}
				</button>
			</span>
		</div>
	</form>
</main>

<style lang="postcss">
	@reference "../../../base.css";

	.settings-header {
		@apply mt-10 flex items-center justify-center gap-4 px-4;
	}

	.guild-icon {
		@apply size-14 rounded-full border border-white/20 object-cover;
	}

	.settings {
		@apply w-full max-w-7xl justify-stretch text-left;

		&.busy {
			@apply cursor-wait;
		}

		.section {
			@apply grid grid-cols-1 items-start gap-6 rounded-2xl bg-mist-900 p-6 md:grid-cols-3 md:gap-10 lg:p-8;

			.section-label {
				@apply text-left md:col-span-1;

				h2 {
					@apply text-2xl font-bold text-white;
				}

				.section-desc {
					@apply mt-2 text-sm text-mist-400;
				}
			}

			.settings-list {
				@apply grid gap-4 text-left md:col-span-2;

				.setting-row {
					@apply grid gap-4 sm:grid-cols-2 sm:items-center;

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
					textarea,
					input[type='number'] {
						@apply w-full rounded-xl border border-white/10 bg-mist-950 p-2.5 text-sm text-white;
						@apply focus:border-blurple focus:ring-1 focus:ring-blurple focus:outline-none;
					}

					textarea {
						@apply resize-y;
					}
				}

				.field {
					@apply grid gap-1;

					&.inline {
						@apply flex items-center gap-2;

						input {
							@apply w-28;
						}
					}
				}
			}
		}
	}

	.switch {
		@apply relative h-6 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-mist-950 transition-colors;
		@apply checked:bg-blurple;

		&::after {
			content: '';
			@apply absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform;
		}

		&:checked::after {
			@apply translate-x-6;
		}

		&:focus-visible {
			@apply outline-2 outline-offset-2 outline-white;
		}
	}

	.ratings-grid {
		@apply grid gap-4 sm:grid-cols-2;
	}

	.rating-group {
		@apply grid content-start gap-2 rounded-xl border border-white/10 bg-mist-950 p-4;

		legend {
			@apply px-1 text-sm font-semibold text-white;
		}
	}

	.rating-option {
		@apply flex cursor-pointer items-center gap-2 text-sm;

		input {
			@apply size-4 accent-blurple;
		}
	}

	.override-list {
		@apply m-0 grid list-none gap-2 p-0;

		li {
			@apply list-none;
		}
	}

	.override-row {
		@apply grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_10rem_auto];

		select {
			@apply w-full rounded-xl border border-white/10 bg-mist-950 p-2.5 text-sm text-white;
			@apply focus:border-blurple focus:ring-1 focus:ring-blurple focus:outline-none;
		}
	}

	.remove {
		@apply flex size-10 items-center justify-center justify-self-end rounded-xl border border-white/10;
		@apply text-red-300 transition-colors;

		&:hover,
		&:focus-visible {
			@apply border-red-400/50 bg-red-400/10 text-red-200;
		}

		svg {
			@apply size-4;
		}
	}

	.add-override {
		@apply w-fit justify-self-start rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold transition-colors;
		@apply hover:border-white/40 hover:bg-mist-950;
		@apply disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:bg-transparent;
	}

	.hint {
		@apply text-xs text-mist-400;
	}

	.alert {
		@apply rounded-xl border px-4 py-3 text-sm;

		&.success {
			@apply border-emerald-400/30 bg-emerald-400/10 text-emerald-200;
		}

		&.error {
			@apply border-red-400/30 bg-red-400/10 text-red-200;
		}
	}

	.savebar {
		@apply mt-2 flex flex-wrap items-center justify-between gap-3;
		@apply rounded-2xl border border-white/10 bg-mist-950 px-4 py-3;

		.save-status {
			@apply text-sm text-mist-400;
		}

		.save-actions {
			@apply flex items-center gap-2;
		}

		button {
			@apply rounded-xl px-4 py-2 text-sm font-semibold transition-colors;

			&:disabled {
				@apply cursor-not-allowed opacity-40;
			}
		}

		.primary {
			@apply bg-blurple text-white hover:bg-blurple-dark;
		}

		.secondary {
			@apply border border-white/15 hover:border-white/40;
		}
	}
</style>
