import { fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

import { RATINGS, isBotLocale } from '$lib';
import { db } from '$lib/server/db';
import { guild } from '$lib/server/db/bot-schema';
import {
	CHANNEL_RATING_KEYS,
	DEFAULT_BATTLE_MINUTES,
	DEFAULT_RATINGS,
	EMPTY_CHANNEL_RATINGS,
	isChannelRatingKey,
	isRating,
	minutesToMicroseconds,
	microsecondsToMinutes,
	normalizeChannelRatings,
	normalizeRatings,
	parseChannelRatingsJson,
	serializeChannelRatings
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

async function findGuildRow(id: bigint) {
	const [row] = await db.select(SETTINGS_SELECTION).from(guild).where(eq(guild.id, id)).limit(1);

	return row;
}

async function getOrCreateGuildRow(id: bigint) {
	const existing = await findGuildRow(id);
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

	const created = await findGuildRow(id);

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

function isTextChannel(channel: DiscordChannel): boolean {
	return channel.type === 0 || channel.type === 5;
}

function textChannels(channels: DiscordChannel[]): DiscordChannel[] {
	return channels.filter(isTextChannel);
}

function inviteChannel(botGuild: DiscordGuild, channels: DiscordChannel[]): string | null {
	const available = textChannels(channels);

	if (botGuild.rules_channel_id) {
		const rules = available.find((channel) => channel.id === botGuild.rules_channel_id);
		if (rules) return rules.id;
	}

	return available.find((channel) => channel.type === 0)?.id ?? available[0]?.id ?? null;
}

function collectRatings(data: FormData, name: string) {
	return data
		.getAll(name)
		.map(String)
		.filter(isRating)
		.filter((rating, index, all) => all.indexOf(rating) === index)
		.sort((a, b) => RATINGS.indexOf(a) - RATINGS.indexOf(b));
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
	const keys = Object.keys(record);

	if (keys.some((key) => !isChannelRatingKey(key))) return null;
	if (CHANNEL_RATING_KEYS.some((key) => !Array.isArray(record[key]))) return null;

	const normalized = normalizeChannelRatings(record);
	const normalizedCount = CHANNEL_RATING_KEYS.reduce(
		(total, key) => total + normalized[key].length,
		0
	);
	const inputCount = CHANNEL_RATING_KEYS.reduce(
		(total, key) => total + (record[key] as unknown[]).length,
		0
	);

	// A mismatch means an entry was invalid or duplicated.
	return normalizedCount === inputCount ? normalized : null;
}

export async function load({ locals, request, params }) {
	if (!locals.user) await protect(request, `/dashboard/${params.slug}`);

	if (!/^\d+$/.test(params.slug)) redirect(303, '/dashboard');

	const userGuild = await getGuild(locals, request, params);
	manageCheck(userGuild);

	const botGuild = await fetchBotGuild(params.slug);

	if (!botGuild) redirect(302, botOAuthUrl(params.slug));

	const channels = (await fetchGuildChannels(params.slug))
		.map((channel) => ({
			id: channel.id,
			name: channel.name,
			type: channel.type,
			position: channel.position,
			parentId: channel.parent_id
		}))
		.sort((a, b) => a.position - b.position);

	const row = await getOrCreateGuildRow(BigInt(params.slug));

	return {
		user: locals.user,
		guild: {
			id: params.slug,
			name: botGuild.name ?? userGuild.name,
			icon: iconUrl(params.slug, botGuild.icon ?? userGuild.icon),
			banner: bannerUrl(params.slug, botGuild.banner)
		},
		settings: {
			lang: row.lang,
			allowExtLang: row.allowExtLang,
			viewJoinButton: row.viewJoinButton,
			description: row.description ?? '',
			public: Boolean(row.invite),
			logch: row.logch?.toString() ?? '',
			ratings: normalizeRatings(row.ratings),
			channelRatings: parseChannelRatingsJson(row.channelRatingsRaw),
			battleTime: microsecondsToMinutes(Number(row.battleTime))
		},
		channels
	};
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

		if (
			logchValue &&
			channels.length > 0 &&
			!textChannels(channels).some((channel) => channel.id === logchValue)
		) {
			return fail(400, { error: 'invalid_logch' });
		}

		const battleMinutes = Number(data.get('battleTime'));

		if (!Number.isSafeInteger(battleMinutes) || battleMinutes < 1 || battleMinutes > 1_000_000) {
			return fail(400, { error: 'invalid_battle_time' });
		}

		const current = await getOrCreateGuildRow(BigInt(params.slug));
		const isPublic = data.get('public') === 'on';
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
					allowExtLang: data.get('allowExtLang') === 'on',
					viewJoinButton: data.get('viewJoinButton') === 'on',
					description:
						String(data.get('description') ?? '')
							.trim()
							.slice(0, 300) || null,
					invite,
					logch: logchValue ? BigInt(logchValue) : null,
					ratings: { normal: normalRatings, nsfw: nsfwRatings },
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
