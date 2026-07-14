import { eq, and, isNull, sql } from 'drizzle-orm'

import { getCacheClient } from './cache.ts'
import { db } from '../drizzle/db.ts'
import { toBase62 } from '../utils.ts'
import { links } from '../drizzle/schema.ts'
import { mightExist, addKey } from './bloomFilter.ts'

const RESERVED_SHORTEN_KEYS = new Set([
  'assets',
  'health',
  'links',
  'login',
  'register'
])

export function isReservedShortenKey (shortenKey: string) {
  return RESERVED_SHORTEN_KEYS.has(shortenKey)
}

export async function createShortenKey () {
  const cache = await getCacheClient()
  const KEY = 'api:globalCounter'
  const MAX_ATTEMPTS = 10

  for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
    const count = await cache.incr(KEY)
    const shortenKey = toBase62(count)

    if (isReservedShortenKey(shortenKey)) continue

    const exists = await mightExist(shortenKey)
    if (!exists) {
      await addKey(shortenKey)
      return shortenKey
    }

    // Possible collision, check database to confirm
    const dbCheck = await findLinkByShortenKey(shortenKey)
    if (!dbCheck) {
      // Database confirms non-existence (false positive), safe to use
      await addKey(shortenKey)
      return shortenKey
    }
  }

  throw new Error('Failed to generate unique shorten key after max attempts')
}

export async function findLinkByShortenKey (shortenKey: string) {
  const result = await db.select().from(links).where(eq(links.shortenKey, shortenKey)).limit(1)
  return result[0] ?? null
}

export async function incrementClickCount (shortenKey: string) {
  const result = await db
    .update(links)
    .set({ clickCount: sql`${links.clickCount} + 1` })
    .where(eq(links.shortenKey, shortenKey))
    .returning({ clickCount: links.clickCount })

  return result[0]?.clickCount ?? 0
}

export async function findLinksByUserId (userId: number) {
  return await db.select().from(links).where(eq(links.userId, userId))
}

export async function findLinkByOriginalUrl (originalUrl: string, userId?: number) {
  const conditions = userId !== undefined
    ? and(eq(links.originalUrl, originalUrl), eq(links.userId, userId))
    : and(eq(links.originalUrl, originalUrl), isNull(links.userId))

  const result = await db.select().from(links).where(conditions).limit(1)
  return result[0] ?? null
}

export async function createLink ({
  originalUrl,
  shortenKey,
  userId
}: {
  originalUrl: string
  shortenKey: string
  userId?: number
}) {
  const result = await db.insert(links).values({
    originalUrl,
    shortenKey,
    userId
  }).returning()

  return result[0]
}
