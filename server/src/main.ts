import { serve } from '@hono/node-server'
import { createApp } from './factories/createApp.js'
import { config } from './config.js'
import { validateEnv } from './utils.js'
import { closeCache, initCache } from './services/cache.js'
import { closeDb, initDb } from './drizzle/db.js'
import { initBloomFilter } from './services/bloomFilter.js'
import {
  userService,
  linkService,
  cacheService,
  tokenService,
  utilsService
} from './services/impls.js'

const app = createApp({
  userService,
  linkService,
  cacheService,
  tokenService,
  utilsService,
  config
})


export async function main (): Promise<void> {
  validateEnv()

  console.log('🚀 Initializing services...')
  try {
    await initDb()
    await initCache()
    await initBloomFilter()
    
    console.log('✅ All services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize services:', error)
    process.exit(1)
  }
  
  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, closing server gracefully...`)
    
    try {
      await closeCache()
      await closeDb()
      console.log('✅ Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }
  
  process.on('SIGTERM', async () => { await shutdown('SIGTERM') })
  process.on('SIGINT', async () => { await shutdown('SIGINT') })

  // Start server
  serve({
    fetch: app.fetch,
    port: config.server.port
  }, (info) => {
    console.log(`Server is running on http://${config.server.host}:${info.port}`)
  })
}

main().catch((error: unknown) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
