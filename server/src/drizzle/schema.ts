import { pgTable, serial, text, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
}, (table) => ({
  // Index for faster email lookups
  emailIdx: index('user_email_idx').on(table.email)
}))

export const links = pgTable('Link', {
  id: serial('id').primaryKey(),
  originalUrl: text('original_url').notNull(),
  shortenKey: varchar('shorten_key', { length: 255 }).notNull().unique(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  userId: integer('userId').references(() => users.id)
}, (table) => ({
  // Index for faster shortenKey lookups (most common query)
  shortenKeyIdx: index('link_shorten_key_idx').on(table.shortenKey),
  // Index for faster user links lookup
  userIdIdx: index('link_user_id_idx').on(table.userId)
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  links: many(links)
}))

export const linksRelations = relations(links, ({ one }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id]
  })
}))
