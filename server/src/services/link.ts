import { eq } from 'drizzle-orm'

import { getCacheClient } from './cache.js'
import { getDbClient } from './db.js'
import { toBase62 } from '../utils.js'
import { links } from '../drizzle/schema.js'

export async function createShortenKey () {
  const cache = await getCacheClient()

  const KEY = 'api:globalCounter'
  const count = await cache.incr(KEY)

  return toBase62(count)
}

const PREFIX_KEY = 'api:link'
const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days in seconds

export async function setLinkFromCache (shortenKey: string, originalUrl: string) {
  const cache = await getCacheClient()

  const key = `${PREFIX_KEY}:${shortenKey}`
  return await cache.set(key, originalUrl, { EX: CACHE_TTL })
}

export async function getLinkFromCache (shortenKey: string) {
  const cache = await getCacheClient()

  const key = `${PREFIX_KEY}:${shortenKey}`
  return await cache.get(key)
}

export async function findLinkByShortenKey (shortenKey: string) {
  const db = await getDbClient()

  const result = await db.select().from(links).where(eq(links.shortenKey, shortenKey)).limit(1)
  return result[0] ?? null
}

export async function findLinksByUserId (userId: number) {
  const db = await getDbClient()

  return await db.select().from(links).where(eq(links.userId, userId))
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
  const db = await getDbClient()

  const result = await db.insert(links).values({
    originalUrl,
    shortenKey,
    userId
  }).returning()

  return result[0]
}
