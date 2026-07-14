import { serve } from '@hono/node-server'
import { createApp } from './factories/createApp.ts'
import { config } from './config.ts'
import { closeCache, initCache } from './services/cache.ts'
import { closeDb, initDb, migrateDb } from './drizzle/db.ts'
import { initBloomFilter } from './services/bloomFilter.ts'
import {
  userService,
  linkService,
  cacheService,
  tokenService,
  utilsService
} from './services/impls.ts'

const app = createApp({
  userService,
  linkService,
  cacheService,
  tokenService,
  utilsService,
  config
})


export async function main (): Promise<void> {
  try {
    await initDb()
    await migrateDb()
    await initCache()
    await initBloomFilter()

    console.log('✅ All services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize services:', error)
    await Promise.allSettled([closeCache(), closeDb()])
    throw error
  }

  const server = serve({
    fetch: app.fetch,
    hostname: config.server.host,
    port: config.server.port
  }, (info) => {
    console.log(`Server is running on http://${config.server.host}:${info.port}`)
  })

  let isShuttingDown = false

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log(`\n${signal} received, closing server gracefully...`)

    let failed = false

    await new Promise<void>((resolve) => {
      server.close((error) => {
        if (error) {
          failed = true
          console.error('❌ Failed to close HTTP server:', error)
        }
        resolve()
      })
    })

    const closeResults = await Promise.allSettled([closeCache(), closeDb()])
    for (const result of closeResults) {
      if (result.status === 'rejected') {
        failed = true
        console.error('❌ Error while closing a service:', result.reason)
      }
    }

    if (failed) {
      process.exitCode = 1
    } else {
      console.log('✅ Graceful shutdown completed')
    }
  }

  process.once('SIGTERM', () => { void shutdown('SIGTERM') })
  process.once('SIGINT', () => { void shutdown('SIGINT') })
}

main().catch((error: unknown) => {
  console.error('Failed to start server:', error)
  process.exitCode = 1
})
