// src/db/schema.ts
import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  name: text('name'),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  googleId: text('google_id'),
  passwordHash: text('password_hash'),
  authProvider: text('auth_provider').default('local').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  dob: text('dob'),
  locality: text('locality').notNull(),
  city: text('city').default('Bangalore').notNull(),
  rentMin: integer('rent_min').notNull(),
  rentMax: integer('rent_max').notNull(),
  foodPreference: text('food_preference').notNull(),
  cleanliness: text('cleanliness').notNull(),
  sleepSchedule: text('sleep_schedule').notNull(),
  smoking: text('smoking').notNull(),
  drinking: text('drinking').notNull(),
  petsPreference: text('pets_preference').notNull(),
  guestPolicy: text('guest_policy').notNull(),
  occupation: text('occupation'),
  bio: text('bio'),
  mainPhoto: text('main_photo'),
  photos: jsonb('photos').$type<any[]>().default([]).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  peaceSignVerified: boolean('peace_sign_verified').default(false).notNull(),
  nonNegotiables: jsonb('non_negotiables').$type<string[]>().default([]).notNull(),
  hobbies: jsonb('hobbies').$type<string[]>().default([]).notNull(),
  languages: jsonb('languages').$type<string[]>().default([]).notNull(),
  prompts: jsonb('prompts').$type<any[]>().default([]).notNull(),
  housingIntent: jsonb('housing_intent').$type<any>().default({}).notNull(),
  houseDetails: jsonb('house_details').$type<any>(),
  profileData: jsonb('profile_data').$type<any>(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const swipes = pgTable('swipes', {
  id: text('id').primaryKey(),
  swiperId: text('swiper_id').references(() => users.id).notNull(),
  targetId: text('target_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  userIds: jsonb('user_ids').$type<string[]>().notNull(),
  matchScore: integer('match_score').notNull(),
  matchBreakdown: jsonb('match_breakdown').$type<any>().default({}).notNull(),
  status: text('status').default('matched').notNull(),
  movingInRequestedBy: jsonb('moving_in_requested_by').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  matchId: text('match_id').references(() => matches.id).notNull(),
  senderId: text('sender_id').references(() => users.id).notNull(),
  recipientId: text('recipient_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const blocks = pgTable('blocks', {
  id: text('id').primaryKey(),
  blockerId: text('blocker_id').references(() => users.id).notNull(),
  blockedId: text('blocked_id').references(() => users.id).notNull(),
  blockedUser: jsonb('blocked_user').$type<any>(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').references(() => users.id).notNull(),
  targetId: text('target_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id').references(() => users.id).primaryKey(),
  newMessageBanner: boolean('new_message_banner').default(true).notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  privacyMode: boolean('privacy_mode').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  settings: one(userSettings, { fields: [users.id], references: [userSettings.userId] }),
  swipesMade: many(swipes, { relationName: 'swipesMade' }),
  messagesSent: many(messages, { relationName: 'messagesSent' }),
  messagesReceived: many(messages, { relationName: 'messagesReceived' }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, { fields: [messages.matchId], references: [matches.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: 'messagesSent' }),
  recipient: one(users, { fields: [messages.recipientId], references: [users.id], relationName: 'messagesReceived' }),
}));
