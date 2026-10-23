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
        siteName = title,
        accentColor = 0x5965f2
    }: Props = $props();

    const absoluteUrl = (value: string) => new URL(value, page.url.origin).href;

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
    <meta property="og:site_name" content={siteName} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={absoluteUrl(page.url.href)} />
    <meta property="og:type" content="website" />

    {#if fallbackImageUrl}
        <meta property="og:image" content={fallbackImageUrl} />
        <meta property="og:image:alt" content={title} />
    {/if}

    <meta name="theme-color" content={themeColor} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />

    {@html embedTag}
</svelte:head>
