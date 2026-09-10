import { protect } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { guild } from "$lib/server/db/bot-schema";
import { account } from "$lib/server/db/auth-schema";
import { eq } from "drizzle-orm";
import { env } from "$env/dynamic/private";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

interface DiscordPartialGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
}

interface DiscordChannel {
    id: string;
    name: string;
    type: number;
    position: number;
    parent_id: string | null;
}

export const load: PageServerLoad = async ({ locals, request, params }) => {
    if (!locals.user) await protect(request, `/dashboard/${params.slug}`);

    if (!/^\d+$/.test(params.slug)) {
        error(404, "Guild not found");
    }

    const [ discordAccount ] = await db.select().from(account)
        .where(eq(account.userId, locals.user!.id))
        .limit(1);

    if (!discordAccount?.accessToken) {
        await protect(request, `/dashboard/${params.slug}`);
    }

    const guildsres = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: {
            Authorization: `Bearer ${discordAccount.accessToken}`
        }
    });

    const discordGuilds: DiscordPartialGuild[] = await guildsres.json();
    const thisGuild = discordGuilds.find((g) => g.id === params.slug)!;

    const perms = BigInt(thisGuild.permissions);
    const hasAccess = thisGuild.owner || (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;

    if (!hasAccess) {
        error(403, "Forbidden");
    }

    const guildres = await fetch(`https://discord.com/api/v10/guilds/${params.slug}?with_counts=true`, {
        headers: {
            Authorization: `Bot ${env.DISCORD_TOKEN}`
        }
    });

    if (!guildres.ok) {
        const oauth = `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&response_type=code&permissions=274945330177&integration_type=0&scope=bot+applications.commands&guild_id=${params.slug}&disable_guild_select=true&redirect_uri=${encodeURIComponent(env.ORIGIN + `/dashboard`)}`;
        redirect(302, oauth);
    }

    const realGuild = await guildres.json();

    const chres = await fetch(`https://discord.com/api/v10/guilds/${params.slug}/channels`, {
        headers: {
            Authorization: `Bot ${env.DISCORD_TOKEN}`
        }
    });

    const discordChannels: DiscordChannel[] = chres.ok ? await chres.json() : [];
    const channels = Array.isArray(discordChannels)
        ? discordChannels.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            position: c.position,
            parentId: c.parent_id
        }))
        : [];

    const [ dbguild ] = await db.select().from(guild)
        .where(eq(guild.id, BigInt(params.slug)))
        .limit(1);

    const rawIcon = realGuild.icon ?? thisGuild.icon;
    const icon = rawIcon
        ? `https://cdn.discordapp.com/icons/${params.slug}/${rawIcon}.${rawIcon.startsWith("a_") ? "gif" : "png"}`
        : null;

    const banner = realGuild.banner
        ? `https://cdn.discordapp.com/banners/${params.slug}/${realGuild.banner}.${realGuild.banner.startsWith("a_") ? "gif" : "png"}`
        : null;

    const settings = {
        lang: dbguild.lang,
        allowUserLang: dbguild.allowUserLang,
        description: dbguild.description,
        invite: dbguild.invite,
        logch: dbguild.logch != null ? dbguild.logch.toString() : null,
        ratings: dbguild.ratings,
        viewJoinButton: dbguild.viewJoinButton,
        battleTime: Number(dbguild.battleTime),
        channelRatings: dbguild.channelRatings
    };

    const guildData = {
        id: params.slug,
        name: realGuild.name ?? thisGuild.name,
        icon,
        banner,
        ...settings
    };

    return {
        user: locals.user,
        guild: guildData,
        settings,
        channels
    };
};