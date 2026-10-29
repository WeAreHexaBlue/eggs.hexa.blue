import type { PathnameWithSearchOrHash } from "$app/types";
import { localizeHref } from "$lib/paraglide/runtime";

const displayNames = new Map<string, Intl.DisplayNames>();

export function localizedHref<T extends PathnameWithSearchOrHash>(path: T): T {
    return localizeHref(path) as T;
}

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

export function ogLocale(locale: string): string {
    try {
        const { language, region } = new Intl.Locale(locale).maximize();

        return region ? `${language}_${region}` : locale.replaceAll("-", "_");
    } catch {
        return locale.replaceAll("-", "_");
    }
}
