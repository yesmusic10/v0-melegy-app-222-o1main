import { pgTable, text, timestamp, boolean, jsonb, integer, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// --- Better Auth required tables from neon_auth schema ---
// These are already created in Neon - we just map them here

export const user = pgTable(
  'user',
  {
    id: uuid('id').primaryKey(),
    email: text('email').unique().notNull(),
    emailVerified: boolean('emailVerified').default(false).notNull(),
    name: text('name'),
    image: text('image'),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
    banned: boolean('banned').default(false),
    banReason: text('banReason'),
    banExpires: timestamp('banExpires', { withTimezone: true }),
    role: text('role').default('user'),
  },
  (table) => ({})
)

export const session = pgTable('session', {
  id: uuid('id').primaryKey(),
  userId: uuid('userId').notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  activeOrganizationId: text('activeOrganizationId'),
  impersonatedBy: text('impersonatedBy'),
})

export const account = pgTable('account', {
  id: uuid('id').primaryKey(),
  userId: uuid('userId').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
})

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }),
  updatedAt: timestamp('updatedAt', { withTimezone: true }),
})

// --- App tables - Subscriptions
export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  currentMonthUsage: integer('currentMonthUsage').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  expiresAt: timestamp('expiresAt'),
})

// --- App tables - Conversations/Chats
export const conversation = pgTable('conversation', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull().default('New Conversation'),
  description: text('description'),
  model: text('model').notNull().default('qwen-2.5-72b-instruct'),
  messageCount: integer('messageCount').notNull().default(0),
  isArchived: boolean('isArchived').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- App tables - Messages
export const message = pgTable('message', {
  id: text('id').primaryKey(),
  conversationId: text('conversationId').notNull(),
  userId: text('userId').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// --- Phone OTP Authentication
export const userPhone = pgTable('userPhone', {
  id: text('id').primaryKey(),
  phone: text('phone').unique().notNull(),
  name: text('name').notNull(),
  birthDate: text('birthDate').notNull(), // YYYY-MM-DD format
  subscriptionPlan: text('subscriptionPlan').notNull().default('free'),
  isVerified: boolean('isVerified').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const otpVerification = pgTable('otpVerification', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  otp: text('otp').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})

// --- App tables - User preferences
export const userPreference = pgTable('userPreference', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  theme: text('theme').notNull().default('light'),
  language: text('language').notNull().default('ar'),
  emailNotifications: boolean('emailNotifications').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}))

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  user: one(user, {
    fields: [conversation.userId],
    references: [user.id],
  }),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  user: one(user, {
    fields: [message.userId],
    references: [user.id],
  }),
}))

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, {
    fields: [userPreference.userId],
    references: [user.id],
  }),
}))
