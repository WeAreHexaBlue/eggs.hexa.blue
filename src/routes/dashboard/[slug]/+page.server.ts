import { fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { guild } from '$lib/server/db/bot-schema';
import {
	DEFAULT_BATTLE_MINUTES,
	DEFAULT_RATINGS,
	EMPTY_CHANNEL_RATINGS,
	isRating,
	minutesToMicroseconds,
	microsecondsToMinutes,
	normalizeChannelRatings,
	normalizeRatings,
	parseChannelRatingsJson,
	RATINGS,
	serializeChannelRatings,
	type ChannelRatingKey
} from '$lib/server/guild-settings';
import {
	botOAuthUrl,
	createGuildInvite,
	fetchBotGuild,
	fetchGuildChannels,
	getGuild,
	manageCheck,
	protect
} from '$lib/server/utils';
import { isBotLocale } from '$lib';

const SETTINGS_SELECTION = {
	id: guild.id,
	lang: guild.lang,
	allowExtLang: guild.allowExtLang,
	description: guild.description,
	invite: guild.invite,
	logch: guild.logch,
	ratings: guild.ratings,
	viewJoinButton: guild.viewJoinButton,
	battleTime: guild.battleTime,
	channelRatingsRaw: sql<string>`${guild.channelRatings}::text`
};

async function getOrCreateGuildRow(id: bigint) {
	const [existing] = await db
		.select(SETTINGS_SELECTION)
		.from(guild)
		.where(eq(guild.id, id))
		.limit(1);

	if (existing) return existing;

	await db
		.insert(guild)
		.values({
			id,
			lang: 'en',
			allowExtLang: true,
			description: null,
			invite: null,
			logch: null,
			ratings: DEFAULT_RATINGS,
			viewJoinButton: true,
			battleTime: minutesToMicroseconds(DEFAULT_BATTLE_MINUTES),
			channelRatings: EMPTY_CHANNEL_RATINGS
		})
		.onConflictDoNothing();

	const [created] = await db
		.select(SETTINGS_SELECTION)
		.from(guild)
		.where(eq(guild.id, id))
		.limit(1);

	if (!created) throw new Error('Could not create guild settings row.');

	return created;
}

function iconUrl(guildId: string, icon: string | null | undefined): string | null {
	if (!icon) return null;

	return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${icon.startsWith('a_') ? 'gif' : 'png'}?size=256`;
}

function bannerUrl(guildId: string, banner: string | null | undefined): string | null {
	if (!banner) return null;

	return `https://cdn.discordapp.com/banners/${guildId}/${banner}.${banner.startsWith('a_') ? 'gif' : 'png'}?size=600`;
}

function textChannels(channels: DiscordChannel[]) {
	return channels.filter((channel) => channel.type === 0 || channel.type === 5);
}

export async function load({ locals, request, params }) {
	if (!locals.user) await protect(request, `/dashboard/${params.slug}`);

	if (!/^\d+$/.test(params.slug)) redirect(303, '/dashboard');

	const userGuild = await getGuild(locals, request, params);
	manageCheck(userGuild);

	const botGuild = await fetchBotGuild(params.slug);

	if (!botGuild) redirect(302, botOAuthUrl(params.slug));

	const rawChannels = await fetchGuildChannels(params.slug);
	const channels = rawChannels
		.map((channel) => ({
			id: channel.id,
			name: channel.name,
			type: channel.type,
			position: channel.position,
			parentId: channel.parent_id
		}))
		.sort((a, b) => a.position - b.position);

	const row = await getOrCreateGuildRow(BigInt(params.slug));

	const settings = {
		lang: row.lang,
		allowExtLang: row.allowExtLang,
		description: row.description ?? '',
		invite: row.invite,
		public: Boolean(row.invite),
		logch: row.logch?.toString() ?? '',
		ratings: normalizeRatings(row.ratings),
		viewJoinButton: row.viewJoinButton,
		battleTime: microsecondsToMinutes(Number(row.battleTime)),
		channelRatings: parseChannelRatingsJson(row.channelRatingsRaw)
	};

	return {
		user: locals.user,
		guild: {
			id: params.slug,
			name: botGuild.name ?? userGuild.name,
			icon: iconUrl(params.slug, botGuild.icon ?? userGuild.icon),
			banner: bannerUrl(params.slug, botGuild.banner),
			...settings
		},
		settings,
		channels
	};
}

function collectRatings(data: FormData, name: string) {
	const values = data
		.getAll(name)
		.map((value) => String(value))
		.filter(isRating);

	return [...new Set(values)].sort((a, b) => RATINGS.indexOf(a) - RATINGS.indexOf(b));
}

function parseChannelRatingsInput(
	value: FormDataEntryValue | null
): ReturnType<typeof normalizeChannelRatings> | null {
	if (typeof value !== 'string') return null;

	let parsed: unknown;

	try {
		parsed = JSON.parse(value);
	} catch {
		return null;
	}

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

	const record = parsed as Record<string, unknown>;

	for (const key of Object.keys(record)) {
		if (!['safe', 'questionable', 'explicit'].includes(key)) return null;
		if (!Array.isArray(record[key])) return null;
	}

	const normalized = normalizeChannelRatings(record);
	const count = (['safe', 'questionable', 'explicit'] as ChannelRatingKey[]).reduce(
		(total, key) => total + normalized[key].length,
		0
	);
	const inputCount = (['safe', 'questionable', 'explicit'] as ChannelRatingKey[]).reduce(
		(total, key) => total + (record[key] as unknown[]).length,
		0
	);

	if (count !== inputCount) return null;

	return normalized;
}

function inviteChannel(botGuild: DiscordGuild, channels: DiscordChannel[]): string | null {
	const available = textChannels(channels);

	if (botGuild.rules_channel_id) {
		const rules = available.find((channel) => channel.id === botGuild.rules_channel_id);
		if (rules) return rules.id;
	}

	return available.find((channel) => channel.type === 0)?.id ?? available[0]?.id ?? null;
}

export const actions = {
	default: async ({ locals, request, params }) => {
		if (!locals.user) return fail(401, { error: 'unauthorized' });
		if (!/^\d+$/.test(params.slug)) return fail(404, { error: 'not_found' });

		const userGuild = await getGuild(locals, request, params);
		manageCheck(userGuild);

		const botGuild = await fetchBotGuild(params.slug);

		if (!botGuild) return fail(409, { error: 'bot_missing' });

		const data = await request.formData();

		const lang = String(data.get('lang') ?? '');

		if (!isBotLocale(lang)) return fail(400, { error: 'invalid_lang' });

		const allowExtLang = data.get('allowExtLang') === 'on';
		const viewJoinButton = data.get('viewJoinButton') === 'on';
		const isPublic = data.get('public') === 'on';
		const description =
			String(data.get('description') ?? '')
				.trim()
				.slice(0, 300) || null;

		const normalRatings = collectRatings(data, 'ratings.normal');
		const nsfwRatings = collectRatings(data, 'ratings.nsfw');

		if (normalRatings.length === 0 || nsfwRatings.length === 0) {
			return fail(400, { error: 'invalid_ratings' });
		}

		if (normalRatings.includes('EXPLICIT')) {
			return fail(400, { error: 'explicit_normal' });
		}

		const channelRatings = parseChannelRatingsInput(data.get('channelRatings'));

		if (!channelRatings) return fail(400, { error: 'invalid_channel_ratings' });

		const channels = await fetchGuildChannels(params.slug);

		const logchValue = String(data.get('logch') ?? '');

		if (logchValue && !/^\d+$/.test(logchValue)) {
			return fail(400, { error: 'invalid_logch' });
		}

		if (logchValue && channels.length > 0) {
			const channel = textChannels(channels).find((entry) => entry.id === logchValue);
			if (!channel) return fail(400, { error: 'invalid_logch' });
		}

		const battleMinutes = Number(data.get('battleTime'));

		if (!Number.isSafeInteger(battleMinutes) || battleMinutes < 1 || battleMinutes > 1_000_000) {
			return fail(400, { error: 'invalid_battle_time' });
		}

		const current = await getOrCreateGuildRow(BigInt(params.slug));

		let invite = current.invite;

		if (isPublic && !invite) {
			const channelId = inviteChannel(botGuild, channels);

			if (!channelId) return fail(400, { error: 'invite_failed' });

			invite = await createGuildInvite(channelId);

			if (!invite) return fail(400, { error: 'invite_failed' });
		} else if (!isPublic) {
			invite = null;
		}

		try {
			await db
				.update(guild)
				.set({
					lang,
					allowExtLang,
					description,
					invite,
					logch: logchValue ? BigInt(logchValue) : null,
					ratings: { normal: normalRatings, nsfw: nsfwRatings },
					viewJoinButton,
					battleTime: minutesToMicroseconds(battleMinutes),
					channelRatings: sql`${serializeChannelRatings(channelRatings)}::jsonb`
				})
				.where(eq(guild.id, BigInt(params.slug)));
		} catch (error) {
			console.error(error);
			return fail(500, { error: 'save_failed' });
		}

		return { ok: true, code: 'saved' };
	}
};
