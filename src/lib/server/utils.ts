import { auth } from "./auth";
import { error, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { account } from "$lib/server/db/auth-schema";
import { eq } from "drizzle-orm";
import type { RouteParams, RouteId } from "$app/types";

const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

export function canManage(guild: DiscordPartialGuild): boolean {
    const perms = BigInt(guild.permissions);
    return guild.owner || (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
}

export function manageCheck(guild: DiscordPartialGuild) {
    if (!canManage(guild))
        error(403, "Forbidden");
}

export async function protect(request: Request, callback: string) {
    const res = await auth.api.signInSocial({
        body: {
            provider: "discord",
            callbackURL: callback
        },
        headers: request.headers
    });
    
    if (res.url)
        redirect(302, res.url);
    
    redirect(307, "/");
}

export async function getGuilds(locals: App.Locals, request: Request, params?: RouteParams<RouteId>) {
    const [ discordAccount ] = await db.select().from(account)
        .where(eq(account.userId, locals.user!.id))
        .limit(1);
    
    if (!discordAccount?.accessToken) {
        await protect(request, `/dashboard/${params?.slug ?? ""}`);
    }
    
    const guildsres = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: {
            Authorization: `Bearer ${discordAccount.accessToken}`
        }
    });
    
    const guilds: DiscordPartialGuild[] = await guildsres.json();

    return guilds;
}

export async function getGuild(locals: App.Locals, request: Request, params: RouteParams<RouteId>) {
    const guilds = await getGuilds(locals, request, params);
    
    const guild = guilds.find((g) => g.id === params.slug)!;

    if (!guild) error(404, "Server not found.");

    return guild;
}