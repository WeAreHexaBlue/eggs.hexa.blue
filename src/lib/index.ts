// place files you want to import through the `$lib` alias in this folder.

import { localizeHref, type Locale } from "./paraglide/runtime";

/**
 * Applies the active locale's URL prefix to an app path.
 * Locale is carried by the URL, so every internal link must go through this.
 */
export function localeHref(path: string, locale?: Locale) {
    return localizeHref(path, locale ? { locale } : undefined);
}

/** Content ratings understood by the bot, from least to most restrictive. */
export const RATINGS = ["SAFE", "QUESTIONABLE", "EXPLICIT"] as const;
