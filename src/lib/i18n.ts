const displayNames = new Map<string, Intl.DisplayNames>();

/**
 * Native name of a locale, e.g. "English", "Italiano", "Deutsch".
 * Resolved with Intl so new locales need no hardcoded name map.
 */
export function localeName(locale: string): string {
    let names = displayNames.get(locale);

    if (!names) {
        try {
            names = new Intl.DisplayNames([locale], { type: "language" });
        } catch {
            return locale;
        }

        displayNames.set(locale, names);
    }

    const name = names.of(locale) ?? locale;

    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/**
 * Open Graph locale for a BCP-47 tag, e.g. "en_US", "it_IT", "pt_BR".
 * Resolved with Intl so new locales need no hardcoded mapping.
 */
export function ogLocale(locale: string): string {
    try {
        const { language, region } = new Intl.Locale(locale).maximize();

        return region ? `${language}_${region}` : locale.replaceAll("-", "_");
    } catch {
        return locale.replaceAll("-", "_");
    }
}
