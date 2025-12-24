import { serve } from '@hono/node-server'
import { createApp } from './factories/createApp.js'
import { config } from './config.js'
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

export async function main (): Promise<void> {
  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, closing server gracefully...`)
    await closeCacheClient()
    process.exit(0)
  }
  process.on('SIGTERM', async () => await shutdown('SIGTERM'))
  process.on('SIGINT', async () => await shutdown('SIGINT'))

  // Start server
  serve({
    fetch: app.fetch,
    port: config.server.port
  }, (info) => {
    console.log(`Server is running on http://${config.server.host}:${info.port}`)
  })
}

main()
