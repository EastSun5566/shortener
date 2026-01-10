import { eq } from 'drizzle-orm'

import { db } from '../drizzle/db.js'
import { users } from '../drizzle/schema.js'

export async function findUserByEmail (email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0] ?? null
}

export async function createUser (email: string, password: string) {
  const result = await db.insert(users).values({ email, password }).returning()
  return result[0]
}
