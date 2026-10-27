<script lang="ts">
    import { page } from "$app/state";
    import {
        baseLocale,
        deLocalizeHref,
        getLocale,
        localizeHref,
        locales
    } from "$lib/paraglide/runtime";

    type EmbedButton = {
        label: string;
        url: string;
    };

    type Props = {
        title: string;
        description: string;
        images?: string[];
        image?: string;
        buttons?: EmbedButton[];
        primaryButton?: EmbedButton;
        siteName?: string;
        accentColor?: number;
    };

    let {
        title,
        description,
        images = [],
        image,
        buttons = [],
        primaryButton,
        siteName = "Server Eggs",
        accentColor = 0x5965f2
    }: Props = $props();

    const OG_LOCALES: Record<string, string> = {
        en: "en_US",
        it: "it_IT"
    };

    const absoluteUrl = (value: string) => new URL(value, page.url.origin).href;

    function normalizePath(path: string) {
        return path.length > 1 ? path.replace(/\/+$/, "") : path;
    }

    const canonicalPath = $derived(normalizePath(page.url.pathname));
    const canonicalUrl = $derived(absoluteUrl(canonicalPath));

    const currentLocale = getLocale();
    const ogLocale = $derived(OG_LOCALES[currentLocale] ?? currentLocale);

    const alternates = $derived.by(() => {
        const path = deLocalizeHref(canonicalPath);

        return locales.map((locale) => ({
            locale,
            href: absoluteUrl(normalizePath(localizeHref(path, { locale })))
        }));
    });

    const xDefault = $derived(
        alternates.find((alternate) => alternate.locale === baseLocale)?.href
    );

    const alternateOgLocales = $derived(
        alternates
            .filter((alternate) => alternate.locale !== currentLocale)
            .map((alternate) => OG_LOCALES[alternate.locale] ?? alternate.locale)
    );

    // Open Graph descriptions are plain text, while component embeds render markdown.
    const plainDescription = $derived(
        description
            .replace(/\\(.)/g, "$1")
            .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/__([^_]+)__/g, "$1")
            .replace(/~~([^~]+)~~/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/_([^_]+)_/g, "$1")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/\s+/g, " ")
            .trim()
    );

    const metaDescription = $derived.by(() => {
        if (plainDescription.length <= 160) return plainDescription;

        const truncated = plainDescription.slice(0, 157);
        const lastSpace = truncated.lastIndexOf(" ");
        const clean = lastSpace > 120 ? truncated.slice(0, lastSpace) : truncated;

        return `${clean.trimEnd()}…`;
    });

    // Discord renders this payload instead of the standard Open Graph card.
    // https://docs.discord.com/developers/link-previews/component-embeds
    const payload = $derived.by(() => {
        const gallery = images.map((url) => ({
            media: { url: absoluteUrl(url) },
            description: title
        }));

        const components: Record<string, unknown>[] = [
            {
                type: 9,
                components: [{ type: 10, content: `# ${title}\n${description}` }],
                ...(primaryButton
                    ? {
                          accessory: {
                              type: 2,
                              style: 5,
                              url: absoluteUrl(primaryButton.url),
                              label: primaryButton.label
                          }
                      }
                    : {})
            }
        ];

        if (gallery.length > 0) {
            components.push({ type: 12, items: gallery });
        }

        if (buttons.length > 0) {
            components.push({
                type: 1,
                components: buttons.map((button) => ({
                    type: 2,
                    style: 5,
                    url: absoluteUrl(button.url),
                    label: button.label
                }))
            });
        }

        return {
            component: {
                type: 17,
                accent_color: accentColor,
                components
            }
        };
    });

    // Escaping "<" keeps the JSON from closing the script element.
    const payloadJson = $derived(JSON.stringify(payload).replaceAll("<", "\\u003c"));
    const closingTag = "</" + "script>";
    const embedTag = $derived(
        `<script id="discord:component-embed" type="application/json">${payloadJson}${closingTag}`
    );

    const fallbackImage = $derived(image ?? images[0]);
    const fallbackImageUrl = $derived(fallbackImage ? absoluteUrl(fallbackImage) : undefined);
    const themeColor = $derived(`#${accentColor.toString(16).padStart(6, "0")}`);
</script>

<svelte:head>
    <meta name="description" content={metaDescription} />

    <link rel="canonical" href={canonicalUrl} />
    {#each alternates as alternate (alternate.locale)}
        <link rel="alternate" hreflang={alternate.locale} href={alternate.href} />
    {/each}
    {#if xDefault}
        <link rel="alternate" hreflang="x-default" href={xDefault} />
    {/if}

    <meta property="og:site_name" content={siteName} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={plainDescription} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content={ogLocale} />
    {#each alternateOgLocales as locale (locale)}
        <meta property="og:locale:alternate" content={locale} />
    {/each}

    {#if fallbackImageUrl}
        <meta property="og:image" content={fallbackImageUrl} />
        <meta property="og:image:alt" content={title} />
    {/if}

    <meta name="theme-color" content={themeColor} />
    <meta name="twitter:card" content={fallbackImageUrl ? "summary_large_image" : "summary"} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={plainDescription} />
    {#if fallbackImageUrl}
        <meta name="twitter:image" content={fallbackImageUrl} />
        <meta name="twitter:image:alt" content={title} />
    {/if}

    {@html embedTag}
</svelte:head>
