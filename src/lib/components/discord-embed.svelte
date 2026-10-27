<script lang="ts">
    import { page } from "$app/state";

    type EmbedButton = {
        label: string;
        url: string;
    };

    type Props = {
        title: string;
        description: string;
        images?: string[];
        image?: string;
        imageAlt?: string;
        buttons?: EmbedButton[];
        primaryButton?: EmbedButton;
        siteName?: string;
        accentColor?: number;
        type?: "website" | "article";
        publishedTime?: string;
    };

    let {
        title,
        description,
        images = [],
        image,
        imageAlt,
        buttons = [],
        primaryButton,
        siteName = "Server Eggs",
        accentColor = 0x5865f2,
        type = "website",
        publishedTime
    }: Props = $props();

    const absoluteUrl = (value: string) => new URL(value, page.url.origin).href;
    const pageUrl = $derived(absoluteUrl(page.url.pathname));

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

    // Discord renders this payload instead of the standard Open Graph card.
    // https://docs.discord.com/developers/link-previews/component-embeds
    const payload = $derived.by(() => {
        const gallery = images.map((url) => ({
            media: { url: absoluteUrl(url) },
            ...(imageAlt ? { description: imageAlt } : {})
        }));

        const linkText = title
            .replace(/\\/g, "\\\\")
            .replace(/\[/g, "\\[")
            .replace(/\]/g, "\\]");

        const content = `# [${linkText}](${pageUrl})\n${description}`;

        const components: Record<string, unknown>[] = [
            primaryButton
                ? {
                      type: 9,
                      components: [{ type: 10, content }],
                      accessory: {
                          type: 2,
                          style: 5,
                          url: absoluteUrl(primaryButton.url),
                          label: primaryButton.label
                      }
                  }
                : { type: 10, content }
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
    <meta property="og:site_name" content={siteName} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={plainDescription} />
    <meta property="og:url" content={pageUrl} />
    <meta property="og:type" content={type} />
    {#if type === "article" && publishedTime}
        <meta property="article:published_time" content={publishedTime} />
    {/if}

    {#if fallbackImageUrl}
        <meta property="og:image" content={fallbackImageUrl} />
        <meta property="og:image:alt" content={imageAlt ?? title} />
    {/if}

    <meta name="theme-color" content={themeColor} />
    <meta name="twitter:card" content={fallbackImageUrl ? "summary_large_image" : "summary"} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={plainDescription} />
    {#if fallbackImageUrl}
        <meta name="twitter:image" content={fallbackImageUrl} />
        <meta name="twitter:image:alt" content={imageAlt ?? title} />
    {/if}

    {@html embedTag}
</svelte:head>
