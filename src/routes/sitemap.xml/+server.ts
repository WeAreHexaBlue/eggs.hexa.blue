import type { RequestHandler } from "./$types";
import { baseLocale, localizeHref, locales } from "$lib/paraglide/runtime";

/** Public routes that exist for every locale. */
const PATHS = ["/"];

function escapeXml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export const GET: RequestHandler = ({ url }) => {
    const origin = url.origin;
    const absolute = (href: string) => `${origin}${href}`;

    const urls = PATHS.flatMap((path) => {
        const alternates = locales.map((locale) => ({
            hreflang: locale,
            href: absolute(localizeHref(path, { locale }))
        }));

        return alternates.map(
            (alternate) => `  <url>
    <loc>${escapeXml(alternate.href)}</loc>
${alternates
    .map(
        (entry) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(entry.hreflang)}" href="${escapeXml(entry.href)}" />`
    )
    .join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absolute(localizeHref(path, { locale: baseLocale })))}" />
  </url>`
        );
    });

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

    return new Response(body, {
        headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600"
        }
    });
};
