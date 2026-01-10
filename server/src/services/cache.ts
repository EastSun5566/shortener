import { createClient, type RedisClientType } from 'redis'
import { setTimeout as sleep } from 'node:timers/promises'

import { config } from '../config.js'

let client: RedisClientType | null = null
let isConnecting = false

export async function getCacheClient (): Promise<RedisClientType> {
  if (client?.isOpen) return client

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    while (true) {
      await sleep(100)
      if (!isConnecting) break
    }
    if (client?.isOpen) return client
  }
  isConnecting = true

  try {
    const redisUrl = process.env.REDIS_URL
    client = redisUrl
      ? createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Max reconnection attempts reached')
              return new Error('Max reconnection attempts reached')
            }
            const delay = Math.min(retries * 100, 3000)
            console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`)
            return delay
          }
        }
      })
      : createClient({
        socket: {
          host: config.cache.host,
          port: config.cache.port,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Max reconnection attempts reached')
              return new Error('Max reconnection attempts reached')
            }
            const delay = Math.min(retries * 100, 3000)
            console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`)
            return delay
          }
        }
      })

    client.on('error', (error: Error) => {
      console.error('Redis Client Error:', error.message)
    })
    client.on('connect', () => {
      console.log('Redis: Connected successfully')
    })
    client.on('reconnecting', () => {
      console.log('Redis: Reconnecting...')
    })

    await client.connect()
    return client
  } catch (error) {
    console.error('Redis: Failed to connect:', error)
    client = null
    throw error
  } finally {
    isConnecting = false
  }
}

export async function initCache() {
  try {
    console.log('🔧 Initializing Redis connection...')
    await getCacheClient()
    console.log('✅ Redis connected and ready')
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error)
    throw error
  }
}

export async function checkCacheHealth() {
  try {
    if (!client?.isOpen) return false
    await client.ping()
    return true
  } catch {
    return false
  }
}

export async function closeCacheClient () {
  if (client?.isOpen) {
    await client.quit()
    client = null
    console.log('✅ Redis connection closed')
  }
}
