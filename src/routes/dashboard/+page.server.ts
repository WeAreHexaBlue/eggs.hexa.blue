import {
    botOAuthUrl,
    canManage,
    getBotGuildIds,
    getGuilds,
    guildIconUrl,
    protect
} from "$lib/server/utils";
import { localizedHref } from "$lib/i18n";
import { redirect } from "@sveltejs/kit";

export async function load({ locals, request, url }) {
    if (!locals.user) await protect(request, localizedHref("/dashboard") + url.search);

    const newGuild = url.searchParams.get("guild_id");

    if (newGuild && /^\d+$/.test(newGuild)) {
        redirect(303, localizedHref(`/dashboard/${newGuild}`));
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
                icon: guildIconUrl(guild.id, guild.icon),
                hasBot,
                href: hasBot ? localizedHref(`/dashboard/${guild.id}`) : botOAuthUrl(guild.id)
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    return {
        guilds,
        addBotUrl: botOAuthUrl()
    };
}
