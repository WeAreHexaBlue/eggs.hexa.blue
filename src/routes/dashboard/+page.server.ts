import { protect } from "$lib/server/auth";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { guild } from "$lib/server/db/bot-schema";
import { account } from "$lib/server/db/auth-schema";
import { eq, inArray } from "drizzle-orm";
import { env } from "$env/dynamic/private";

const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

interface DiscordPartialGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
}

export async function load({ locals, request, url }) {
    const newguild = url.searchParams.get("guild_id");
    if (newguild && /^\d+$/.test(newguild)) {
        redirect(303, `/dashboard/${newguild}`);
    }

    if (!locals.user) await protect(request, "/dashboard");

    const [ discordAccount ] = await db.select().from(account)
        .where(eq(account.userId, locals.user!.id))
        .limit(1);
    
    if (!discordAccount.accessToken)
        return { user: locals.user, guilds: [] };

    const guildres = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: {
            "Authorization": `Bearer ${discordAccount.accessToken}`
        }
    });

    const discordGuilds: DiscordPartialGuild[] = await guildres.json();

    const allowedGuilds = discordGuilds.filter((g) => {
        if (g.owner) return true;

        const perms = BigInt(g.permissions);
        return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
    });

    const botHavingSet = new Set<string>();

    if (allowedGuilds.length > 0) {
        const ids = allowedGuilds.map((g) => BigInt(g.id));
        const dbguilds = await db.select({ id: guild.id }).from(guild)
            .where(inArray(guild.id, ids));

        await Promise.all(
            dbguilds.map(async (g) => {
                const res = await fetch(`https://discord.com/api/v10/guilds/${g.id}`, {
                    headers: {
                        Authorization: `Bot ${env.DISCORD_TOKEN}`
                    }
                });

                if (res.ok) {
                    botHavingSet.add(g.id.toString());
                }
            })
        );
    }

    const guilds = allowedGuilds.map((g) => {
        return {
            id: g.id,
            name: g.name,
            icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith("a_") ? "gif" : "png"}` : null,
            hasBot: botHavingSet.has(g.id),
            oauth: `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&response_type=code&permissions=274945330177&integration_type=0&scope=bot+applications.commands&guild_id=${g.id}&disable_guild_select=true&redirect_uri=${encodeURIComponent(env.ORIGIN + `/dashboard`)}`
        }
    });

    return { user: locals.user, guilds };
}
