import { relations } from "drizzle-orm/relations";
import { users, analyticsSnapshots, autoReplyRules, connectedAccounts, posts, postPlatformResults } from "./schema";

export const analyticsSnapshotsRelations = relations(analyticsSnapshots, ({one}) => ({
	user: one(users, {
		fields: [analyticsSnapshots.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	analyticsSnapshots: many(analyticsSnapshots),
	autoReplyRules: many(autoReplyRules),
	connectedAccounts: many(connectedAccounts),
	posts: many(posts),
}));

export const autoReplyRulesRelations = relations(autoReplyRules, ({one}) => ({
	user: one(users, {
		fields: [autoReplyRules.userId],
		references: [users.id]
	}),
}));

export const connectedAccountsRelations = relations(connectedAccounts, ({one}) => ({
	user: one(users, {
		fields: [connectedAccounts.userId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	postPlatformResults: many(postPlatformResults),
}));

export const postPlatformResultsRelations = relations(postPlatformResults, ({one}) => ({
	post: one(posts, {
		fields: [postPlatformResults.postId],
		references: [posts.id]
	}),
}));