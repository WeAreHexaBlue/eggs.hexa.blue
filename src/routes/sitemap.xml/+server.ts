import { baseLocale, locales } from "$lib/paraglide/runtime";
import type { RequestEvent } from "./$types";

const STATIC_PATHS = ["/"];

function localizedPath(path: string, locale: string): string {
    const prefix = locale === baseLocale ? "" : `/${locale}`;
    const suffix = path === "/" ? "" : path;
    const localized = `${prefix}${suffix}`;

    return localized === "" ? "/" : localized;
}

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

export function GET({ url }: RequestEvent) {
    const urls = STATIC_PATHS.flatMap((path) =>
        locales.map((locale) => localizedPath(path, locale))
    ).map((path) => {
        const loc = escapeXml(new URL(path, url.origin).href);

        return `    <url>\n        <loc>${loc}</loc>\n    </url>`;
    });

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

    return new Response(body, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600"
        }
    });
}
