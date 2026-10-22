import {
    pgTable,
    index,
    foreignKey,
    serial,
    text,
    timestamp,
    bigint,
    varchar,
    boolean,
    uniqueIndex,
    integer,
    unique,
    bigserial,
    jsonb
} from "drizzle-orm/pg-core";

/**
 * Read-only mirror of the database owned by the Server Eggs bot.
 *
 * Tortoise migrations in the bot repository are the source of truth. Never
 * generate or push Drizzle migrations for these tables.
 */

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

export const egg = pgTable(
    "egg",
    {
        id: serial().primaryKey().notNull(),
        text: text(),
        attachPath: text("attach_path"),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
        editedAt: timestamp("edited_at", { withTimezone: true, mode: "string" }).notNull(),
        creatorId: bigint("creator_id", { mode: "bigint" }),
        originId: bigint("origin_id", { mode: "bigint" }),
        attachHash: varchar("attach_hash", { length: 64 }),
        attachLink: text("attach_link"),
        secret: boolean(),
        rating: varchar({ length: 12 }).$type<Rating>().notNull(),
        lang: varchar({ length: 5 }).notNull(),
        pendingScan: boolean("pending_scan").notNull()
    },
    (table) => [
        index("idx_egg_attach__91d888").using(
            "btree",
            table.attachHash.asc().nullsLast().op("text_ops")
        ),
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
        }).onDelete("cascade")
    ]
);

export const guildFilteredEggs = pgTable(
    "guild_filtered_eggs",
    {
        guildId: bigint("guild_id", { mode: "bigint" }).notNull(),
        eggId: integer("egg_id").notNull()
    },
    (table) => [
        uniqueIndex("uidx_guild_filte_guild_i_905755").using(
            "btree",
            table.guildId.asc().nullsLast().op("int4_ops"),
            table.eggId.asc().nullsLast().op("int4_ops")
        ),
        foreignKey({
            columns: [table.guildId],
            foreignColumns: [guild.id],
            name: "guild_filtered_eggs_guild_id_fkey"
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.eggId],
            foreignColumns: [egg.id],
            name: "guild_filtered_eggs_egg_id_fkey"
        }).onDelete("cascade")
    ]
);

export const battleVote = pgTable(
    "battle_vote",
    {
        id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
        choice: integer().notNull(),
        battleId: bigint("battle_id", { mode: "bigint" }).notNull(),
        voterId: bigint("voter_id", { mode: "bigint" }).notNull()
    },
    (table) => [
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
        unique("uid_battle_vote_battle__74db0b").on(table.battleId, table.voterId)
    ]
);

export const battle = pgTable(
    "battle",
    {
        id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
        channelId: bigint("channel_id", { mode: "bigint" }),
        messageId: bigint("message_id", { mode: "bigint" }),
        endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }).notNull(),
        status: varchar({ length: 10 }).notNull(),
        eggAId: integer("egg_a_id"),
        eggBId: integer("egg_b_id"),
        guildId: bigint("guild_id", { mode: "bigint" }).notNull(),
        userAId: bigint("user_a_id", { mode: "bigint" }),
        userBId: bigint("user_b_id", { mode: "bigint" }),
        winnerId: integer("winner_id"),
        winnerUserId: bigint("winner_user_id", { mode: "bigint" })
    },
    (table) => [
        index("idx_battle_ends_at_447025").using(
            "btree",
            table.endsAt.asc().nullsLast().op("timestamptz_ops")
        ),
        foreignKey({
            columns: [table.eggAId],
            foreignColumns: [egg.id],
            name: "fk_battle_egg_a"
        }).onDelete("set null"),
        foreignKey({
            columns: [table.eggBId],
            foreignColumns: [egg.id],
            name: "fk_battle_egg_b"
        }).onDelete("set null"),
        foreignKey({
            columns: [table.guildId],
            foreignColumns: [guild.id],
            name: "battle_guild_id_fkey"
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userAId],
            foreignColumns: [duser.id],
            name: "fk_battle_user_a"
        }).onDelete("set null"),
        foreignKey({
            columns: [table.userBId],
            foreignColumns: [duser.id],
            name: "fk_battle_user_b"
        }).onDelete("set null"),
        foreignKey({
            columns: [table.winnerId],
            foreignColumns: [egg.id],
            name: "fk_battle_winner"
        }).onDelete("set null"),
        foreignKey({
            columns: [table.winnerUserId],
            foreignColumns: [duser.id],
            name: "fk_battle_winner_user"
        }).onDelete("set null")
    ]
);

export const duser = pgTable(
    "user",
    {
        id: bigint({ mode: "bigint" }).primaryKey().notNull(),
        lang: varchar({ length: 5 }).default("").notNull(),
        banned: boolean().notNull(),
        public: boolean().notNull(),
        allowExplicitDms: boolean("allow_explicit_dms").notNull(),
        lastDailyAt: timestamp("last_daily_at", { withTimezone: true, mode: "string" })
    },
    (table) => [
        index("idx_user_id_f555bd").using("btree", table.id.asc().nullsLast().op("int8_ops")),
        index("idx_user_last_da_8314b5").using(
            "btree",
            table.lastDailyAt.asc().nullsLast().op("timestamptz_ops")
        )
    ]
);

export const embedhost = pgTable(
    "embedhost",
    {
        id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
        host: varchar({ length: 253 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull()
    },
    (table) => [unique("embedhost_host_key").on(table.host)]
);

export const presence = pgTable("presence", {
    id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
    text: text().notNull(),
    info: text(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    code: text()
});

export const guild = pgTable(
    "guild",
    {
        // You can use { mode: "bigint" } if numbers are exceeding js number limitations
        id: bigint({ mode: "bigint" }).primaryKey().notNull(),
        lang: varchar({ length: 5 }).default("en").notNull(),
        allowExtLang: boolean("allow_ext_lang").notNull(),
        description: text(),
        invite: text(),
        logch: bigint({ mode: "bigint" }),
        ratings: jsonb().$type<GuildRatings>().notNull(),
        viewJoinButton: boolean("view_join_button").notNull(),
        // You can use { mode: "bigint" } if numbers are exceeding js number limitations
        battleTime: bigint("battle_time", { mode: "number" }).notNull(),
        channelRatings: jsonb("channel_ratings").$type<GuildChannelRatings>().notNull()
    },
    (table) => [
        index("idx_guild_id_b011ce").using("btree", table.id.asc().nullsLast().op("int8_ops"))
    ]
);

export const tortoiseMigrations = pgTable(
    "tortoise_migrations",
    {
        id: serial().primaryKey().notNull(),
        app: varchar({ length: 255 }).notNull(),
        name: varchar({ length: 255 }).notNull(),
        appliedAt: timestamp("applied_at", { withTimezone: true, mode: "string" }).notNull()
    },
    (table) => [unique("uid_tortoise_mi_app_3803a5").on(table.app, table.name)]
);

export const report = pgTable(
    "report",
    {
        id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
        eggId: integer("egg_id").notNull(),
        reporterId: bigint("reporter_id", { mode: "bigint" }).notNull(),
        logMessageId: bigint("log_message_id", { mode: "bigint" }),
        reason: varchar({ length: 200 })
    },
    (table) => [
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
        unique("uid_report_egg_id_184ac7").on(table.eggId, table.reporterId)
    ]
);

export const userCollectedEggs = pgTable(
    "user_collected_eggs",
    {
        userId: bigint("user_id", { mode: "bigint" }).notNull(),
        eggId: integer("egg_id").notNull()
    },
    (table) => [
        uniqueIndex("uidx_user_collec_user_id_29d788").using(
            "btree",
            table.userId.asc().nullsLast().op("int4_ops"),
            table.eggId.asc().nullsLast().op("int4_ops")
        ),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [duser.id],
            name: "user_collected_eggs_user_id_fkey"
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.eggId],
            foreignColumns: [egg.id],
            name: "user_collected_eggs_egg_id_fkey"
        }).onDelete("cascade")
    ]
);
