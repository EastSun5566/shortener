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

export async function findLinkByShortenKey (shortenKey: string) {
  const result = await db.select().from(links).where(eq(links.shortenKey, shortenKey)).limit(1)
  return result[0] ?? null
}

export async function incrementClickCount (shortenKey: string) {
  const cache = await getCacheClient()
  const CLICK_KEY = `click:${shortenKey}`
  
  // Increment in Redis for fast response
  const count = await cache.incr(CLICK_KEY)
  
  // Sync to database every 10 clicks or after TTL expires
  if (count % 10 === 0 || count === 1) {
    // Asynchronously update database (don't wait)
    syncClickCountToDb(shortenKey).catch(err => {
      console.error(`Failed to sync click count for ${shortenKey}:`, err)
    })
  }
  
  return count
}

async function syncClickCountToDb (shortenKey: string) {
  const cache = await getCacheClient()
  const CLICK_KEY = `click:${shortenKey}`
  
  // Get current count from Redis
  const countStr = await cache.get(CLICK_KEY)
  if (!countStr) return
  
  const redisCount = parseInt(countStr, 10)
  
  // Update database
  await db
    .update(links)
    .set({ clickCount: redisCount })
    .where(eq(links.shortenKey, shortenKey))
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
