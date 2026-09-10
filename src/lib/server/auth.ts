import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

import { redirect } from "@sveltejs/kit";

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg",
		schemaName: "auth"
	}),
	socialProviders: {
		discord: {
			clientId: env.DISCORD_CLIENT_ID!,
			clientSecret: env.DISCORD_CLIENT_SECRET!,
			scope: ["identify", "guilds"]
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

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