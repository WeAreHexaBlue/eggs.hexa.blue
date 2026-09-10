import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";

export async function load({ locals, request }) {
    if (!locals.user) {
        const res = await auth.api.signInSocial({
            body: {
                provider: "discord",
                callbackURL: "/dashboard"
            },
            headers: request.headers
        });

        if (res.url) {
            redirect(302, res.url);
        }

        redirect(307, "/");
    }

    return { user: locals.user };
}