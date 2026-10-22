// place files you want to import through the `$lib` alias in this folder.

/** Content ratings understood by the bot, from least to most restrictive. */
export const RATINGS = ['SAFE', 'QUESTIONABLE', 'EXPLICIT'] as const;

/** Languages supported by the bot, keyed by their stored code. */
export const codeToHuman = {
	en: 'English',
	it: 'Italiano',
	de: 'Deutsch',
	nl: 'Nederlands',
	es: 'Español',
	'en-XS': '[[KROMER]]'
} as const;

export type BotLocale = keyof typeof codeToHuman;

export const botLocales = Object.keys(codeToHuman) as BotLocale[];

export function isBotLocale(value: string): value is BotLocale {
	return Object.hasOwn(codeToHuman, value);
}
