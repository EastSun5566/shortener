import { eq } from 'drizzle-orm'

import { getDbClient } from './db.js'
import { users } from '../drizzle/schema.js'

export async function findUserByEmail (email: string) {
  const db = await getDbClient()

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0] ?? null
}

export async function createUser (email: string, password: string) {
  const db = await getDbClient()

  const result = await db.insert(users).values({ email, password }).returning()
  return result[0]
}
