<script lang="ts">
    import { page } from "$app/state";
    import { m } from "$lib/paraglide/messages";
    import {
        baseLocale,
        deLocalizeUrl,
        getLocale,
        locales,
        localizeHref,
        type Locale
    } from "$lib/paraglide/runtime";

    const OG_LOCALES: Record<Locale, string> = {
        en: "en_US",
        it: "it_IT"
    };

    const SITE_NAME = "Server Eggs";
    const DISCOVERY_URL = "https://discord.com/discovery/applications/886686500845138041";
    const SUPPORT_URL = "https://discord.gg/G9vfEZGZnT";
    const SOURCE_URL = "https://github.com/WeAreHexaBlue/ServerEggs";

    type Props = {
        description?: string;
        type?: "website" | "article";
    };

    let { description = m["seo.description"](), type = "website" }: Props = $props();

    const origin = $derived(page.url.origin);
    const locale = $derived(getLocale());

    function normalize(path: string) {
        return path === "/" ? "/" : path.replace(/\/+$/, "");
    }

    function absolute(path: string) {
        return `${origin}${normalize(path)}`;
    }

    // The URL is the source of truth for the locale, so the canonical URL is the
    // current one and every translation is derived from the de-localized path.
    const basePath = $derived(normalize(deLocalizeUrl(page.url).pathname));
    const canonical = $derived(absolute(page.url.pathname));

    const alternates = $derived(
        locales.map((entry) => ({
            locale: entry,
            href: absolute(localizeHref(basePath, { locale: entry }))
        }))
    );
    const defaultHref = $derived(absolute(localizeHref(basePath, { locale: baseLocale })));

    const jsonLd = $derived(
        JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    "@id": `${origin}/#organization`,
                    name: "HexaBlue",
                    url: "https://hexa.blue/",
                    logo: "https://hexa.blue/logo.svg",
                    sameAs: ["https://github.com/WeAreHexaBlue", "https://discord.gg/DsARcGwwdM"]
                },
                {
                    "@type": "WebSite",
                    "@id": `${origin}/#website`,
                    name: SITE_NAME,
                    url: `${origin}/`,
                    inLanguage: locale,
                    publisher: { "@id": `${origin}/#organization` }
                },
                {
                    "@type": "SoftwareApplication",
                    "@id": `${origin}/#application`,
                    name: SITE_NAME,
                    applicationCategory: "GameApplication",
                    operatingSystem: "Discord",
                    description: m["seo.description"](),
                    url: `${origin}${localizeHref("/")}`,
                    installUrl: DISCOVERY_URL,
                    sameAs: [DISCOVERY_URL, SUPPORT_URL, SOURCE_URL],
                    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                    publisher: { "@id": `${origin}/#organization` }
                }
            ]
        }).replaceAll("<", "\\u003c")
    );

    // Split so the Svelte parser does not treat this as the end of the script block.
    const jsonLdTag = $derived(`<script type="application/ld+json">${jsonLd}` + "</" + "script>");
</script>

<svelte:head>
    <meta name="description" content={description} />

    <link rel="canonical" href={canonical} />

    {#each alternates as alternate (alternate.locale)}
        <link rel="alternate" hreflang={alternate.locale} href={alternate.href} />
    {/each}
    <link rel="alternate" hreflang="x-default" href={defaultHref} />

    <meta property="og:locale" content={OG_LOCALES[locale]} />
    {#each alternates as alternate (alternate.locale)}
        {#if alternate.locale !== locale}
            <meta property="og:locale:alternate" content={OG_LOCALES[alternate.locale]} />
        {/if}
    {/each}
    <meta property="og:type" content={type} />

    {@html jsonLdTag}
</svelte:head>
