import { botOAuthUrl, canManage, getBotGuildIds, getGuilds, protect } from '$lib/server/utils';
import { redirect } from '@sveltejs/kit';

function iconUrl(guildId: string, icon: string | null): string | null {
	if (!icon) return null;

	const extension = icon.startsWith('a_') ? 'gif' : 'png';

	return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${extension}?size=128`;
}

export async function load({ locals, request, url }) {
	if (!locals.user) await protect(request, `/dashboard${url.search}`);

	const newGuild = url.searchParams.get('guild_id');

	if (newGuild && /^\d+$/.test(newGuild)) {
		redirect(303, `/dashboard/${newGuild}`);
	}

	const discordGuilds = await getGuilds(locals, request);
	const botGuilds = await getBotGuildIds();

	const guilds = discordGuilds
		.filter(canManage)
		.map((guild) => {
			const hasBot = botGuilds.has(guild.id);

			return {
				id: guild.id,
				name: guild.name,
				icon: iconUrl(guild.id, guild.icon),
				hasBot,
				href: hasBot ? `/dashboard/${guild.id}` : botOAuthUrl(guild.id),
				addUrl: hasBot ? null : botOAuthUrl(guild.id)
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));

	return {
		user: locals.user,
		guilds,
		addBotUrl: botOAuthUrl()
	};
}
