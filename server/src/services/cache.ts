import { createClient, type RedisClientType } from 'redis'

import { config } from '../config.js'

let client: RedisClientType | null = null
export async function getCacheClient () {
  if (client != null) return client

  const redisUrl = process.env.REDIS_URL
  client = redisUrl
    ? createClient({ url: redisUrl })
    : createClient({
      socket: {
        host: config.cache.host,
        port: config.cache.port
      }
    })
  client.on('error', error => { console.error('Redis Client Error', error) })

  await client.connect()

  return client
}
