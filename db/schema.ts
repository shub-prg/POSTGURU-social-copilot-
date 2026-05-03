import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  boolean,
  uuid,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const platformEnum = pgEnum('platform', [
  'TWITTER',
  'LINKEDIN',
  'INSTAGRAM',
  'FACEBOOK',
  'YOUTUBE',
  'PINTEREST',
  'REDDIT',
  'THREADS',
]);
export const postStatusEnum = pgEnum('post_status', ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED']);
export const triggerTypeEnum = pgEnum('trigger_type', ['ANY_COMMENT', 'KEYWORD_MATCH', 'POSITIVE_SENTIMENT', 'NEGATIVE_SENTIMENT']);
export const replyModeEnum = pgEnum('reply_mode', ['TEMPLATE', 'AI_GENERATED']);

// Users table (mirrors Clerk users + extra metadata)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Connected Accounts (OAuth tokens for platforms)
export const connectedAccounts = pgTable('connected_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  platform: platformEnum('platform').notNull(),
  platformAccountId: varchar('platform_account_id', { length: 255 }).notNull(),
  platformUsername: varchar('platform_username', { length: 255 }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  profilePictureUrl: text('profile_picture_url'),
  followersCount: integer('followers_count'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return [
    uniqueIndex('user_platform_unique_idx').on(table.userId, table.platform),
  ];
});

// Posts
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  mediaUrls: jsonb('media_urls').default([]),
  scheduledAt: timestamp('scheduled_at'),
  status: postStatusEnum('status').default('DRAFT').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Platform results for each post
export const postPlatformResults = pgTable('post_platform_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  platform: platformEnum('platform').notNull(),
  connectedAccountId: uuid('connected_account_id')
    .references(() => connectedAccounts.id, { onDelete: 'cascade' }),
  platformPostId: varchar('platform_post_id', { length: 255 }),
  status: postStatusEnum('status').default('SCHEDULED').notNull(),
  errorMessage: text('error_message'),
  publishedAt: timestamp('published_at'),
});

// Auto Reply Rules
export const autoReplyRules = pgTable('auto_reply_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  triggerType: triggerTypeEnum('trigger_type').default('ANY_COMMENT').notNull(),
  keywords: jsonb('keywords').default([]),
  platforms: jsonb('platforms').notNull(), // Array of platform strings
  replyMode: replyModeEnum('reply_mode').default('TEMPLATE').notNull(),
  replyTemplate: text('reply_template'),
  aiPrompt: text('ai_prompt'),
  isActive: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Auto Reply Logs
export const autoReplyLogs = pgTable('auto_reply_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ruleId: uuid('rule_id')
    .references(() => autoReplyRules.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  platform: platformEnum('platform').notNull(),
  platformPostId: varchar('platform_post_id', { length: 255 }).notNull(),
  platformCommentId: varchar('platform_comment_id', { length: 255 }).notNull(),
  commentText: text('comment_text'),
  replyContent: text('reply_content').notNull(),
  status: varchar('status', { length: 50 }).default('SUCCESS').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics Snapshots
export const analyticsSnapshots = pgTable('analytics_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  platform: platformEnum('platform').notNull(),
  followersCount: integer('followers_count'),
  engagementRate: text('engagement_rate'), // Store as decimal or string %
  snapshotDate: timestamp('snapshot_date').defaultNow().notNull(),
}, (table) => {
  return [
    uniqueIndex('user_platform_snapshot_idx').on(table.userId, table.platform, table.snapshotDate),
  ];
});

// Post Analytics Snapshots
export const postAnalyticsSnapshots = pgTable('post_analytics_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  platformPostId: varchar('platform_post_id', { length: 255 }).notNull(),
  platform: platformEnum('platform').notNull(),
  likesCount: integer('likes_count'),
  commentsCount: integer('comments_count'),
  sharesCount: integer('shares_count'),
  viewsCount: integer('views_count'),
  engagementRate: text('engagement_rate'), // Store as decimal or string %
  snapshotDate: timestamp('snapshot_date').defaultNow().notNull(),
}, (table) => {
  return [
    uniqueIndex('post_platform_snapshot_idx').on(table.postId, table.platform, table.snapshotDate),
  ];
});

// Media Assets (Persistent Media Library)
export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  url: text('url').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileId: varchar('file_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Settings
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  emailNotificationsEnabled: boolean('email_notifications_enabled').default(true).notNull(),
  notifyOnPostSuccess: boolean('notify_on_post_success').default(true).notNull(),
  notifyOnPostFailure: boolean('notify_on_post_failure').default(true).notNull(),
  notifyOnNewComment: boolean('notify_on_new_comment').default(false).notNull(),
  aiReplyTone: varchar('ai_reply_tone', { length: 50 }).default('Friendly').notNull(),
  timezone: varchar('timezone', { length: 100 }).default('UTC').notNull(),
  weeklyReportEnabled: boolean('weekly_report_enabled').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  connectedAccounts: many(connectedAccounts),
  posts: many(posts),
  autoReplyRules: many(autoReplyRules),
  autoReplyLogs: many(autoReplyLogs),
  analyticsSnapshots: many(analyticsSnapshots),
  mediaAssets: many(mediaAssets),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  results: many(postPlatformResults),
  analyticsSnapshots: many(postAnalyticsSnapshots),
}));

export const postPlatformResultsRelations = relations(postPlatformResults, ({ one }) => ({
  post: one(posts, {
    fields: [postPlatformResults.postId],
    references: [posts.id],
  }),
  connectedAccount: one(connectedAccounts, {
    fields: [postPlatformResults.connectedAccountId],
    references: [connectedAccounts.id],
  }),
}));

export const connectedAccountsRelations = relations(connectedAccounts, ({ one }) => ({
  user: one(users, {
    fields: [connectedAccounts.userId],
    references: [users.id],
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  user: one(users, {
    fields: [mediaAssets.userId],
    references: [users.id],
  }),
}));

export const postAnalyticsSnapshotsRelations = relations(postAnalyticsSnapshots, ({ one }) => ({
  post: one(posts, {
    fields: [postAnalyticsSnapshots.postId],
    references: [posts.id],
  }),
}));

export const autoReplyRulesRelations = relations(autoReplyRules, ({ one, many }) => ({
  user: one(users, {
    fields: [autoReplyRules.userId],
    references: [users.id],
  }),
  logs: many(autoReplyLogs),
}));

export const autoReplyLogsRelations = relations(autoReplyLogs, ({ one }) => ({
  rule: one(autoReplyRules, {
    fields: [autoReplyLogs.ruleId],
    references: [autoReplyRules.id],
  }),
  user: one(users, {
    fields: [autoReplyLogs.userId],
    references: [users.id],
  }),
}));

export const analyticsSnapshotsRelations = relations(analyticsSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [analyticsSnapshots.userId],
    references: [users.id],
  }),
}));
