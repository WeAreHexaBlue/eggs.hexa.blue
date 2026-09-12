import { pgTable, index, foreignKey, serial, text, timestamp, bigint, varchar, boolean, uniqueIndex, integer, unique, bigserial, jsonb } from "drizzle-orm/pg-core"

export type Rating = "SAFE" | "QUESTIONABLE" | "EXPLICIT";

export interface GuildRatings {
    normal: Rating[];
    nsfw: Rating[];
}

export interface GuildChannelRatings {
    safe: string[];
    questionable: string[];
    explicit: string[];
}

export const egg = pgTable("egg", {
	id: serial().primaryKey().notNull(),
	text: text(),
	attachPath: text("attach_path"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
	editedAt: timestamp("edited_at", { withTimezone: true, mode: "string" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	creatorId: bigint("creator_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	originId: bigint("origin_id", { mode: "number" }),
	attachHash: varchar("attach_hash", { length: 64 }),
	attachLink: text("attach_link"),
	secret: boolean(),
	rating: varchar({ length: 12 }).notNull(),
}, (table) => [
	index("idx_egg_attach__91d888").using("btree", table.attachHash.asc().nullsLast().op("text_ops")),
	index("idx_egg_text_trgm").using("gin", table.text.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [duser.id],
			name: "egg_creator_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.originId],
			foreignColumns: [guild.id],
			name: "egg_origin_id_fkey"
		}).onDelete("cascade"),
]);

export const guildFilteredEggs = pgTable("guild_filtered_eggs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	guildId: bigint("guild_id", { mode: "number" }).notNull(),
	eggId: integer("egg_id").notNull(),
}, (table) => [
	uniqueIndex("uidx_guild_filte_guild_i_905755").using("btree", table.guildId.asc().nullsLast().op("int4_ops"), table.eggId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.guildId],
			foreignColumns: [guild.id],
			name: "guild_filtered_eggs_guild_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eggId],
			foreignColumns: [egg.id],
			name: "guild_filtered_eggs_egg_id_fkey"
		}).onDelete("cascade"),
]);

export const battleVote = pgTable("battle_vote", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	choice: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	battleId: bigint("battle_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	voterId: bigint("voter_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.battleId],
			foreignColumns: [battle.id],
			name: "battle_vote_battle_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.voterId],
			foreignColumns: [duser.id],
			name: "battle_vote_voter_id_fkey"
		}).onDelete("cascade"),
	unique("uid_battle_vote_battle__74db0b").on(table.battleId, table.voterId),
]);

export const battle = pgTable("battle", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	channelId: bigint("channel_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	messageId: bigint("message_id", { mode: "number" }),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }).notNull(),
	status: varchar({ length: 10 }).notNull(),
	eggAId: integer("egg_a_id").notNull(),
	eggBId: integer("egg_b_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	guildId: bigint("guild_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userAId: bigint("user_a_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userBId: bigint("user_b_id", { mode: "number" }),
	winnerId: integer("winner_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	winnerUserId: bigint("winner_user_id", { mode: "number" }),
}, (table) => [
	index("idx_battle_ends_at_447025").using("btree", table.endsAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.eggAId],
			foreignColumns: [egg.id],
			name: "battle_egg_a_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eggBId],
			foreignColumns: [egg.id],
			name: "battle_egg_b_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.guildId],
			foreignColumns: [guild.id],
			name: "battle_guild_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userAId],
			foreignColumns: [duser.id],
			name: "battle_user_a_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userBId],
			foreignColumns: [duser.id],
			name: "battle_user_b_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.winnerId],
			foreignColumns: [egg.id],
			name: "battle_winner_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.winnerUserId],
			foreignColumns: [duser.id],
			name: "battle_winner_user_id_fkey"
		}).onDelete("cascade"),
]);

export const duser = pgTable("user", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "bigint" }).primaryKey().notNull(),
	lang: varchar({ length: 5 }).default("").notNull(),
	banned: boolean().notNull(),
	public: boolean().notNull(),
}, (table) => [
	index("idx_user_id_f555bd").using("btree", table.id.asc().nullsLast().op("int8_ops")),
]);

export const guild = pgTable("guild", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "bigint" }).primaryKey().notNull(),
	lang: varchar({ length: 5 }).default("en").notNull(),
	allowUserLang: boolean("allow_user_lang").notNull(),
	description: text(),
	invite: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	logch: bigint({ mode: "number" }),
	ratings: jsonb().notNull(),
	viewJoinButton: boolean("view_join_button").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	battleTime: bigint("battle_time", { mode: "number" }).notNull(),
	channelRatings: jsonb("channel_ratings").notNull(),
}, (table) => [
	index("idx_guild_id_b011ce").using("btree", table.id.asc().nullsLast().op("int8_ops")),
]);

export const tortoiseMigrations = pgTable("tortoise_migrations", {
	id: serial().primaryKey().notNull(),
	app: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	appliedAt: timestamp("applied_at", { withTimezone: true, mode: "string" }).notNull(),
}, (table) => [
	unique("uid_tortoise_mi_app_3803a5").on(table.app, table.name),
]);

export const report = pgTable("report", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
	eggId: integer("egg_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	reporterId: bigint("reporter_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	logMessageId: bigint("log_message_id", { mode: "number" }),
	reason: varchar({ length: 200 }),
}, (table) => [
	foreignKey({
			columns: [table.eggId],
			foreignColumns: [egg.id],
			name: "report_egg_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [duser.id],
			name: "report_reporter_id_fkey"
		}).onDelete("cascade"),
	unique("uid_report_egg_id_184ac7").on(table.eggId, table.reporterId),
]);

export const userCollectedEggs = pgTable("user_collected_eggs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	eggId: integer("egg_id").notNull(),
}, (table) => [
	uniqueIndex("uidx_user_collec_user_id_29d788").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.eggId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [duser.id],
			name: "user_collected_eggs_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eggId],
			foreignColumns: [egg.id],
			name: "user_collected_eggs_egg_id_fkey"
		}).onDelete("cascade"),
]);
