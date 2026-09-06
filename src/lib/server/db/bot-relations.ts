import { relations } from "drizzle-orm/relations";
import { duser, egg, guild, guildFilteredEggs, battle, battleVote, report, userCollectedEggs } from "./bot-schema";

export const eggRelations = relations(egg, ({one, many}) => ({
	user: one(duser, {
		fields: [egg.creatorId],
		references: [duser.id]
	}),
	guild: one(guild, {
		fields: [egg.originId],
		references: [guild.id]
	}),
	guildFilteredEggs: many(guildFilteredEggs),
	battles_eggAId: many(battle, {
		relationName: "battle_eggAId_egg_id"
	}),
	battles_eggBId: many(battle, {
		relationName: "battle_eggBId_egg_id"
	}),
	battles_winnerId: many(battle, {
		relationName: "battle_winnerId_egg_id"
	}),
	reports: many(report),
	userCollectedEggs: many(userCollectedEggs),
}));

export const userRelations = relations(duser, ({many}) => ({
	eggs: many(egg),
	battleVotes: many(battleVote),
	battles_userAId: many(battle, {
		relationName: "battle_userAId_user_id"
	}),
	battles_userBId: many(battle, {
		relationName: "battle_userBId_user_id"
	}),
	battles_winnerUserId: many(battle, {
		relationName: "battle_winnerUserId_user_id"
	}),
	reports: many(report),
	userCollectedEggs: many(userCollectedEggs),
}));

export const guildRelations = relations(guild, ({many}) => ({
	eggs: many(egg),
	guildFilteredEggs: many(guildFilteredEggs),
	battles: many(battle),
}));

export const guildFilteredEggsRelations = relations(guildFilteredEggs, ({one}) => ({
	guild: one(guild, {
		fields: [guildFilteredEggs.guildId],
		references: [guild.id]
	}),
	egg: one(egg, {
		fields: [guildFilteredEggs.eggId],
		references: [egg.id]
	}),
}));

export const battleVoteRelations = relations(battleVote, ({one}) => ({
	battle: one(battle, {
		fields: [battleVote.battleId],
		references: [battle.id]
	}),
	user: one(duser, {
		fields: [battleVote.voterId],
		references: [duser.id]
	}),
}));

export const battleRelations = relations(battle, ({one, many}) => ({
	battleVotes: many(battleVote),
	egg_eggAId: one(egg, {
		fields: [battle.eggAId],
		references: [egg.id],
		relationName: "battle_eggAId_egg_id"
	}),
	egg_eggBId: one(egg, {
		fields: [battle.eggBId],
		references: [egg.id],
		relationName: "battle_eggBId_egg_id"
	}),
	guild: one(guild, {
		fields: [battle.guildId],
		references: [guild.id]
	}),
	user_userAId: one(duser, {
		fields: [battle.userAId],
		references: [duser.id],
		relationName: "battle_userAId_user_id"
	}),
	user_userBId: one(duser, {
		fields: [battle.userBId],
		references: [duser.id],
		relationName: "battle_userBId_user_id"
	}),
	egg_winnerId: one(egg, {
		fields: [battle.winnerId],
		references: [egg.id],
		relationName: "battle_winnerId_egg_id"
	}),
	user_winnerUserId: one(duser, {
		fields: [battle.winnerUserId],
		references: [duser.id],
		relationName: "battle_winnerUserId_user_id"
	}),
}));

export const reportRelations = relations(report, ({one}) => ({
	egg: one(egg, {
		fields: [report.eggId],
		references: [egg.id]
	}),
	user: one(duser, {
		fields: [report.reporterId],
		references: [duser.id]
	}),
}));

export const userCollectedEggsRelations = relations(userCollectedEggs, ({one}) => ({
	user: one(duser, {
		fields: [userCollectedEggs.userId],
		references: [duser.id]
	}),
	egg: one(egg, {
		fields: [userCollectedEggs.eggId],
		references: [egg.id]
	}),
}));