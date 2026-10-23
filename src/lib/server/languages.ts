import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { env } from "$env/dynamic/private";

export interface BotLanguage {
    code: string;
    name: string;
}

/** How long a directory scan is reused before checking the bot's lang folder again. */
const CACHE_TTL = 60_000;

let cache: { languages: BotLanguage[]; at: number } | null = null;
let pending: Promise<BotLanguage[]> | null = null;

function languageDirectory(): string {
    const directory = env.BOT_LANG_DIR?.trim();

    if (!directory) {
        throw new Error(
            "BOT_LANG_DIR is not set. Point it at the bot's lang directory (for example /srv/ServerEggs/lang)."
        );
    }

    return directory;
}

async function readLanguages(): Promise<BotLanguage[]> {
    const directory = languageDirectory();
    let files: string[];

    try {
        files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
    } catch (error) {
        throw new Error(`Could not read the bot language directory at ${directory}.`, {
            cause: error
        });
    }

    if (files.length === 0) {
        throw new Error(`No bot language files found in ${directory}.`);
    }

    const languages = await Promise.all(
        files.map(async (file) => {
            const code = file.slice(0, -".json".length);

            if (!code) {
                throw new Error(`Invalid bot language filename: ${file}`);
            }

            let data: unknown;

            try {
                data = JSON.parse(await readFile(path.join(directory, file), "utf8"));
            } catch (error) {
                throw new Error(`Could not read the bot language file ${file}.`, { cause: error });
            }

            const languageName =
                data && typeof data === "object"
                    ? (data as { language_name?: unknown }).language_name
                    : undefined;

            return {
                code,
                name:
                    typeof languageName === "string" && languageName.length > 0
                        ? languageName
                        : code
            };
        })
    );

    return languages.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Languages the bot can reply in, read from its `lang` directory.
 * Cached briefly so new locale files show up without a dashboard restart.
 */
export async function getBotLanguages(): Promise<BotLanguage[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL) return cache.languages;

    pending ??= readLanguages().finally(() => {
        pending = null;
    });

    const languages = await pending;

    cache = { languages, at: Date.now() };

    return languages;
}
