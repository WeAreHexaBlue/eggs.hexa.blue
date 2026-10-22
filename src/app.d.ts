import type { User, Session } from 'better-auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface DiscordPartialGuild {
		id: string;
		name: string;
		icon: string | null;
		owner: boolean;
		permissions: string;
	}

	interface DiscordChannel {
		id: string;
		name: string;
		type: number;
		position: number;
		parent_id: string | null;
	}

	interface DiscordGuild {
		id: string;
		name: string;
		icon: string | null;
		banner?: string | null;
		description?: string | null;
		rules_channel_id?: string | null;
	}
}

export {};
