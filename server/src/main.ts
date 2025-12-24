import { serve } from '@hono/node-server'
import { createApp } from './factories/createApp.js'
import { config } from './config.js'
import { validateEnv } from './utils.js'
import { closeCacheClient } from './services/cache.js'
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

// eslint-disable-next-line @typescript-eslint/require-await
export async function main (): Promise<void> {
  // Validate environment
  validateEnv()
  
  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, closing server gracefully...`)
    await closeCacheClient()
    process.exit(0)
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
