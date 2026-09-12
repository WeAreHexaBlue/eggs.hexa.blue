import { getGuild, manageCheck, protect } from "$lib/server/utils";
import { db } from "$lib/server/db";
import { guild } from "$lib/server/db/bot-schema";
import { eq } from "drizzle-orm";
import { env } from "$env/dynamic/private";
import { error, fail, redirect } from "@sveltejs/kit";

export async function load({ locals, request, params }) {
    if (!locals.user) await protect(request, `/dashboard/${params.slug}`);

    if (!/^\d+$/.test(params.slug)) {
        error(404, "Guild not found");
    }

    const thisGuild = await getGuild(locals, request, params);
    manageCheck(thisGuild);

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

export const actions = {
    default: async ({ locals, request, params }) => {
        if (!locals.user) fail(401, "Unauthorized.");

        const thisGuild = await getGuild(locals, request, params);
        manageCheck(thisGuild);

        const data = await request.formData();

        // process updates

        try {
            await db.update(guild)
                .set({})
                .where(eq(guild.id, BigInt(params.slug))) 

            return { ok: true };
        } catch (e) {
            console.error(e);
            return fail(500, { message: "Failed to save settings." })
        }
    }
}