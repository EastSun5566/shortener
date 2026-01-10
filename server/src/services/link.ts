import { eq, and } from 'drizzle-orm'

import { getCacheClient } from './cache.js'
import { db } from '../drizzle/db.js'
import { toBase62 } from '../utils.js'
import { links } from '../drizzle/schema.js'
import { mightExist, addKey } from './bloomFilter.js'

export async function createShortenKey () {
  const cache = await getCacheClient()
  const KEY = 'api:globalCounter'
  
  let shortenKey: string
  let attempts = 0
  const MAX_ATTEMPTS = 10

  // if shortenKey collision occurs, retry
  do {
    const count = await cache.incr(KEY)
    shortenKey = toBase62(count)
    
    const exists = await mightExist(shortenKey)
    if (!exists) {
      break
    }
    
    // Possible collision, check database to confirm
    const dbCheck = await findLinkByShortenKey(shortenKey)
    if (!dbCheck) {
      // Database confirms non-existence (false positive), safe to use
      break
    }
    
    attempts++
    if (attempts >= MAX_ATTEMPTS) {
      throw new Error('Failed to generate unique shorten key after max attempts')
    }
  } while (attempts < MAX_ATTEMPTS)

  // Add the new key to Bloom Filter
  await addKey(shortenKey)
  
  return shortenKey
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
  const result = await db.select().from(links).where(eq(links.shortenKey, shortenKey)).limit(1)
  return result[0] ?? null
}

export async function findLinksByUserId (userId: number) {
  return await db.select().from(links).where(eq(links.userId, userId))
}

export async function findLinkByOriginalUrl (originalUrl: string, userId?: number) {
  const conditions = userId
    ? and(eq(links.originalUrl, originalUrl), eq(links.userId, userId))
    : eq(links.originalUrl, originalUrl)

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
