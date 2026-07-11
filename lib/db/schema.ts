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
  userid: text('userid').notNull(),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  currentmonthusage: integer('currentmonthusage').notNull().default(0),
  createdat: timestamp('createdat').notNull().defaultNow(),
  updatedat: timestamp('updatedat').notNull().defaultNow(),
  expiresat: timestamp('expiresat'),
})

// --- App tables - Conversations/Chats
export const conversation = pgTable('conversation', {
  id: text('id').primaryKey(),
  userid: text('userid').notNull(),
  title: text('title').notNull().default('New Conversation'),
  description: text('description'),
  model: text('model').notNull().default('qwen-2.5-72b-instruct'),
  messagecount: integer('messagecount').notNull().default(0),
  isarchived: boolean('isarchived').notNull().default(false),
  createdat: timestamp('createdat').notNull().defaultNow(),
  updatedat: timestamp('updatedat').notNull().defaultNow(),
})

// --- App tables - Messages
export const message = pgTable('message', {
  id: text('id').primaryKey(),
  conversationid: text('conversationid').notNull(),
  userid: text('userid').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdat: timestamp('createdat').notNull().defaultNow(),
})

// --- Phone OTP Authentication
export const userPhone = pgTable('userphone', {
  id: text('id').primaryKey(),
  phone: text('phone').unique().notNull(),
  name: text('name').notNull(),
  birthdate: text('birthdate').notNull(), // YYYY-MM-DD format
  subscriptionplan: text('subscriptionplan').notNull().default('free'),
  isverified: boolean('isverified').notNull().default(false),
  createdat: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
  updatedat: timestamp('updatedat', { withTimezone: true }).notNull().defaultNow(),
})

export const otpVerification = pgTable('otpverification', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  otp: text('otp').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresat: timestamp('expiresat', { withTimezone: true }).notNull(),
  createdat: timestamp('createdat', { withTimezone: true }).notNull().defaultNow(),
})

// --- App tables - User preferences
export const userPreference = pgTable('userPreference', {
  id: text('id').primaryKey(),
  userid: text('userid').notNull().unique(),
  theme: text('theme').notNull().default('light'),
  language: text('language').notNull().default('ar'),
  emailnotifications: boolean('emailnotifications').notNull().default(true),
  createdat: timestamp('createdat').notNull().defaultNow(),
  updatedat: timestamp('updatedat').notNull().defaultNow(),
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
    fields: [subscription.userid],
    references: [user.id],
  }),
}))

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  user: one(user, {
    fields: [conversation.userid],
    references: [user.id],
  }),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationid],
    references: [conversation.id],
  }),
  user: one(user, {
    fields: [message.userid],
    references: [user.id],
  }),
}))

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, {
    fields: [userPreference.userid],
    references: [user.id],
  }),
}))
