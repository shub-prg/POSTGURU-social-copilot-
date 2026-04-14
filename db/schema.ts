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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const platformEnum = pgEnum('platform', ['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'FACEBOOK']);
export const postStatusEnum = pgEnum('post_status', ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED']);

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  platform: platformEnum('platform').notNull(),
  triggerKeywords: jsonb('trigger_keywords').notNull(), // Array of strings
  replyContent: text('reply_content').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics Snapshots
export const analyticsSnapshots = pgTable('analytics_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  platform: platformEnum('platform').notNull(),
  followersCount: integer('followers_count').default(0).notNull(),
  engagementRate: text('engagement_rate'), // Store as decimal or string %
  snapshotDate: timestamp('snapshot_date').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  connectedAccounts: many(connectedAccounts),
  posts: many(posts),
  autoReplyRules: many(autoReplyRules),
  analyticsSnapshots: many(analyticsSnapshots),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  results: many(postPlatformResults),
}));

export const connectedAccountsRelations = relations(connectedAccounts, ({ one }) => ({
  user: one(users, {
    fields: [connectedAccounts.userId],
    references: [users.id],
  }),
}));
