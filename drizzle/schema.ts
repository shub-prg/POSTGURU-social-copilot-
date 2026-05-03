import { pgTable, unique, uuid, varchar, timestamp, foreignKey, integer, text, jsonb, boolean, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const platform = pgEnum("platform", ['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'YOUTUBE', 'PINTEREST', 'REDDIT', 'THREADS'])
export const postStatus = pgEnum("post_status", ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'])


export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clerkId: varchar("clerk_id", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_clerk_id_unique").on(table.clerkId),
]);

export const analyticsSnapshots = pgTable("analytics_snapshots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	platform: platform().notNull(),
	followersCount: integer("followers_count").default(0).notNull(),
	engagementRate: text("engagement_rate"),
	snapshotDate: timestamp("snapshot_date", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "analytics_snapshots_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const autoReplyRules = pgTable("auto_reply_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	platform: platform().notNull(),
	triggerKeywords: jsonb("trigger_keywords").notNull(),
	replyContent: text("reply_content").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auto_reply_rules_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const connectedAccounts = pgTable("connected_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	platform: platform().notNull(),
	platformAccountId: varchar("platform_account_id", { length: 255 }).notNull(),
	platformUsername: varchar("platform_username", { length: 255 }),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	profilePictureUrl: text("profile_picture_url"),
	followersCount: integer("followers_count").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("user_platform_unique_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.platform.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "connected_accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const posts = pgTable("posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	mediaUrls: jsonb("media_urls").default([]),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	status: postStatus().default('DRAFT').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const postPlatformResults = pgTable("post_platform_results", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	platform: platform().notNull(),
	platformPostId: varchar("platform_post_id", { length: 255 }),
	status: postStatus().default('SCHEDULED').notNull(),
	errorMessage: text("error_message"),
	publishedAt: timestamp("published_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_platform_results_post_id_posts_id_fk"
		}).onDelete("cascade"),
]);
