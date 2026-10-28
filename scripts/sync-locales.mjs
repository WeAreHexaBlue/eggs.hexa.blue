#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const messagesDir = path.join(root, "messages");
const settingsPath = path.join(root, "project.inlang", "settings.json");

const entries = await readdir(messagesDir, { withFileTypes: true });
const codes = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -".json".length))
    .sort();

if (codes.length === 0) {
    throw new Error(`No message files found in ${messagesDir}.`);
}

for (const code of codes) {
    let canonical;

    try {
        canonical = Intl.getCanonicalLocales(code)[0];
    } catch {
        canonical = undefined;
    }

    if (canonical !== code) {
        throw new Error(
            `messages/${code}.json must use a canonical BCP-47 tag (for example "pt-BR", not "pt_BR"). ` +
                `Rename the file, or set Weblate's "Language code style" to "BCP style using hyphen as a separator".`
        );
    }

    JSON.parse(await readFile(path.join(messagesDir, `${code}.json`), "utf8"));
}

const raw = await readFile(settingsPath, "utf8");
const settings = JSON.parse(raw);
const baseLocale = settings?.baseLocale;

if (typeof baseLocale !== "string" || baseLocale.length === 0) {
    throw new Error(`${settingsPath} must define "baseLocale".`);
}

if (!codes.includes(baseLocale)) {
    throw new Error(`Base locale "${baseLocale}" has no messages/${baseLocale}.json file.`);
}

const locales = [baseLocale, ...codes.filter((code) => code !== baseLocale)];
const match = raw.match(/("locales"\s*:\s*)\[[^\]]*\]/);
const currentMatch = raw.match(/"locales"\s*:\s*(\[[^\]]*\])/);

if (!match || !currentMatch) {
    throw new Error(`Could not find the "locales" array in ${settingsPath}.`);
}

const current = JSON.parse(currentMatch[1]);

if (JSON.stringify(current) !== JSON.stringify(locales)) {
    const serialized = `[${locales.map((code) => JSON.stringify(code)).join(", ")}]`;

    await writeFile(settingsPath, raw.replace(match[0], `${match[1]}${serialized}`));

    console.log(`[locales] Updated project.inlang/settings.json: ${locales.join(", ")}`);
}
