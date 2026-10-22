import { auth } from './auth';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { account } from '$lib/server/db/auth-schema';
import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const DISCORD_API = 'https://discord.com/api/v10';
const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

/** Permissions required for the bot to manage Egg settings and create invites. */
export const BOT_PERMISSIONS = '274945330177';

const TOKEN_REFRESH_MARGIN = 60_000;
const BOT_GUILD_CACHE_TTL = 60_000;

type DiscordAccount = typeof account.$inferSelect;

function botHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return { Authorization: `Bot ${env.DISCORD_TOKEN}`, ...extra };
}

export function canManage(guild: DiscordPartialGuild): boolean {
	const permissions = BigInt(guild.permissions ?? '0');

	return (
		guild.owner ||
		(permissions & ADMINISTRATOR) === ADMINISTRATOR ||
		(permissions & MANAGE_GUILD) === MANAGE_GUILD
	);
}

export function manageCheck(guild: DiscordPartialGuild) {
	if (!canManage(guild)) error(403, 'You do not have permission to manage this server.');
}

/** Start the Discord OAuth flow, returning to `callback` afterwards. */
export async function protect(request: Request, callback: string): Promise<never> {
	const res = await auth.api.signInSocial({
		body: {
			provider: 'discord',
			callbackURL: callback
		},
		headers: request.headers
	});

	if (res.url) redirect(302, res.url);

	redirect(307, '/');
}

async function getDiscordAccount(userId: string): Promise<DiscordAccount | undefined> {
	const [record] = await db
		.select()
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, 'discord')))
		.limit(1);

	return record;
}

async function refreshDiscordToken(record: DiscordAccount): Promise<string | null> {
	if (!record.refreshToken || !env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) return null;

	const res = await fetch(`${DISCORD_API}/oauth2/token`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: env.DISCORD_CLIENT_ID,
			client_secret: env.DISCORD_CLIENT_SECRET,
			grant_type: 'refresh_token',
			refresh_token: record.refreshToken
		})
	});

	if (!res.ok) return null;

	const token = (await res.json()) as {
		access_token?: string;
		refresh_token?: string;
		expires_in?: number;
	};

	if (!token.access_token) return null;

	await db
		.update(account)
		.set({
			accessToken: token.access_token,
			refreshToken: token.refresh_token ?? record.refreshToken,
			accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 604_800) * 1000),
			updatedAt: new Date()
		})
		.where(eq(account.id, record.id));

	return token.access_token;
}

async function getDiscordAccessToken(
	locals: App.Locals,
	request: Request,
	callback: string
): Promise<string> {
	if (!locals.user) await protect(request, callback);
	if (!locals.user) error(401, 'Unauthorized.');

	const record = await getDiscordAccount(locals.user.id);

	if (!record?.accessToken) await protect(request, callback);
	if (!record?.accessToken) error(401, 'Your Discord account is not linked.');

	const expiresSoon =
		record.accessTokenExpiresAt != null &&
		record.accessTokenExpiresAt.getTime() <= Date.now() + TOKEN_REFRESH_MARGIN;

	if (expiresSoon) {
		const refreshed = await refreshDiscordToken(record);
		if (refreshed) return refreshed;
	}

	return record.accessToken;
}

async function fetchUserGuilds(
	locals: App.Locals,
	request: Request,
	callback: string
): Promise<DiscordPartialGuild[]> {
	let token = await getDiscordAccessToken(locals, request, callback);
	const guilds: DiscordPartialGuild[] = [];
	let after: string | undefined;

	for (let page = 0; page < 10; page++) {
		const url = new URL(`${DISCORD_API}/users/@me/guilds`);
		url.searchParams.set('limit', '200');
		if (after) url.searchParams.set('after', after);

		let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

		if (res.status === 401) {
			const record = await getDiscordAccount(locals.user!.id);
			const refreshed = record ? await refreshDiscordToken(record) : null;

			if (!refreshed) await protect(request, callback);
			if (!refreshed) error(401, 'Could not refresh your Discord session.');

			token = refreshed;
			res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
		}

		if (res.status === 429)
			error(503, 'Discord is rate limiting us. Please try again in a moment.');
		if (!res.ok) error(502, 'Discord did not return your server list.');

		const data = (await res.json()) as unknown;

		if (!Array.isArray(data)) error(502, 'Discord returned an unexpected server list.');

		guilds.push(...(data as DiscordPartialGuild[]));

		if (data.length < 200) break;

		after = (data[data.length - 1] as DiscordPartialGuild).id;
	}

	return guilds;
}

/** Guilds the signed-in user can manage, as reported by Discord. */
export async function getGuilds(
	locals: App.Locals,
	request: Request,
	slug?: string
): Promise<DiscordPartialGuild[]> {
	return fetchUserGuilds(locals, request, slug ? `/dashboard/${slug}` : '/dashboard');
}

export async function getGuild(
	locals: App.Locals,
	request: Request,
	params: { slug: string }
): Promise<DiscordPartialGuild> {
	const guilds = await getGuilds(locals, request, params.slug);
	const guild = guilds.find((g) => g.id === params.slug);

	if (!guild) error(404, 'Server not found.');

	return guild;
}

let botGuildCache: { ids: Set<string>; at: number } | null = null;

/** IDs of every guild the bot is currently in. Cached briefly to avoid hitting Discord on every request. */
export async function getBotGuildIds(): Promise<Set<string>> {
	if (botGuildCache && Date.now() - botGuildCache.at < BOT_GUILD_CACHE_TTL) {
		return botGuildCache.ids;
	}

	const ids = new Set<string>();
	let after: string | undefined;
	let succeeded = false;

	for (let page = 0; page < 10; page++) {
		const url = new URL(`${DISCORD_API}/users/@me/guilds`);
		url.searchParams.set('limit', '200');
		if (after) url.searchParams.set('after', after);

		const res = await fetch(url, { headers: botHeaders() });

		if (!res.ok) break;

		const data = (await res.json()) as unknown;
		if (!Array.isArray(data)) break;

		succeeded = true;

		for (const guild of data as { id: string }[]) ids.add(guild.id);

		if (data.length < 200) break;

		after = (data[data.length - 1] as { id: string }).id;
	}

	if (succeeded) botGuildCache = { ids, at: Date.now() };

	return ids;
}

export async function fetchBotGuild(guildId: string): Promise<DiscordGuild | null> {
	const res = await fetch(`${DISCORD_API}/guilds/${guildId}?with_counts=true`, {
		headers: botHeaders()
	});

	if (!res.ok) return null;

	return (await res.json()) as DiscordGuild;
}

export async function fetchGuildChannels(guildId: string): Promise<DiscordChannel[]> {
	const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
		headers: botHeaders()
	});

	if (!res.ok) return [];

	const data = (await res.json()) as unknown;

	return Array.isArray(data) ? (data as DiscordChannel[]) : [];
}

export async function createGuildInvite(channelId: string): Promise<string | null> {
	const res = await fetch(`${DISCORD_API}/channels/${channelId}/invites`, {
		method: 'POST',
		headers: botHeaders({ 'content-type': 'application/json' }),
		body: JSON.stringify({ max_age: 0, max_uses: 0, unique: false })
	});

	if (!res.ok) return null;

	const invite = (await res.json()) as { code?: string; url?: string };

	if (invite.url) return invite.url;
	if (invite.code) return `https://discord.gg/${invite.code}`;

	return null;
}

/** URL that adds the bot to `guildId`, or to any server when omitted. */
export function botOAuthUrl(guildId?: string, redirectTo = '/dashboard'): string {
	const url = new URL('https://discord.com/oauth2/authorize');

	url.searchParams.set('client_id', env.DISCORD_CLIENT_ID ?? '');
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('permissions', BOT_PERMISSIONS);
	url.searchParams.set('integration_type', '0');
	url.searchParams.set('scope', 'bot applications.commands');

	if (guildId) {
		url.searchParams.set('guild_id', guildId);
		url.searchParams.set('disable_guild_select', 'true');
	}

	url.searchParams.set('redirect_uri', `${env.ORIGIN}${redirectTo}`);

	return url.toString();
}
