import { RATINGS } from '$lib';
import type { GuildChannelRatings, GuildRatings, Rating } from '$lib/server/db/bot-schema';

export const CHANNEL_RATING_KEYS = ['safe', 'questionable', 'explicit'] as const;

export type ChannelRatingKey = (typeof CHANNEL_RATING_KEYS)[number];

export const MICROSECONDS_PER_MINUTE = 60_000_000;

export const DEFAULT_BATTLE_MINUTES = 10;

export const DEFAULT_RATINGS: GuildRatings = {
	normal: ['SAFE', 'QUESTIONABLE'],
	nsfw: ['SAFE', 'QUESTIONABLE', 'EXPLICIT']
};

function emptyChannelRatings(): GuildChannelRatings {
	return { safe: [], questionable: [], explicit: [] };
}

export const EMPTY_CHANNEL_RATINGS: GuildChannelRatings = emptyChannelRatings();

export function isRating(value: unknown): value is Rating {
	return typeof value === 'string' && (RATINGS as readonly string[]).includes(value);
}

export function isChannelRatingKey(value: unknown): value is ChannelRatingKey {
	return typeof value === 'string' && (CHANNEL_RATING_KEYS as readonly string[]).includes(value);
}

function normalizeRatingList(value: unknown, fallback: Rating[]): Rating[] {
	if (!Array.isArray(value)) return [...fallback];

	return [...new Set(value.filter(isRating))];
}

export function normalizeRatings(value: unknown): GuildRatings {
	const data = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

	return {
		normal: normalizeRatingList(data.normal, DEFAULT_RATINGS.normal),
		nsfw: normalizeRatingList(data.nsfw, DEFAULT_RATINGS.nsfw)
	};
}

export function normalizeChannelRatings(value: unknown): GuildChannelRatings {
	const data = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	const result = emptyChannelRatings();
	const seen = new Set<string>();

	for (const key of CHANNEL_RATING_KEYS) {
		const list = Array.isArray(data[key]) ? data[key] : [];

		for (const entry of list) {
			if (typeof entry !== 'string' && typeof entry !== 'number') continue;

			const id = String(entry);
			if (!/^\d{5,20}$/.test(id) || seen.has(id)) continue;

			seen.add(id);
			result[key].push(id);
		}
	}

	return result;
}

/**
 * Discord snowflakes are larger than JavaScript's safe integer range, so plain
 * JSON.parse() quietly rounds IDs stored by the bot. Quote every long integer
 * token before parsing to preserve the exact ID.
 */
export function parseChannelRatingsJson(raw: string): GuildChannelRatings {
	try {
		const safe = raw.replace(
			/("(?:\\.|[^"\\])*")|(-?\d{16,})/g,
			(_match, string: string | undefined, integer: string | undefined) => string ?? `"${integer}"`
		);

		return normalizeChannelRatings(JSON.parse(safe));
	} catch {
		return emptyChannelRatings();
	}
}

/** Builds a jsonb literal with unquoted numeric IDs, matching the bot's format. */
export function serializeChannelRatings(value: GuildChannelRatings): string {
	const lists = CHANNEL_RATING_KEYS.map((key) => {
		const ids = value[key]
			.filter((id) => /^\d+$/.test(id))
			.map((id) => BigInt(id).toString())
			.join(',');

		return `"${key}":[${ids}]`;
	});

	return `{${lists.join(',')}}`;
}

export function minutesToMicroseconds(minutes: number): number {
	return minutes * MICROSECONDS_PER_MINUTE;
}

export function microsecondsToMinutes(microseconds: number): number {
	return Math.max(1, Math.round(microseconds / MICROSECONDS_PER_MINUTE));
}
