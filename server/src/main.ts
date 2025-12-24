import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId, type RequestIdVariables } from 'hono/request-id'
import { HTTPException } from 'hono/http-exception'

import {
  linkRoute,
  userRoute
} from './routes/index.js'
import { config } from './config.js'
import { closeCacheClient } from './services/cache.js'

const app = new Hono<{ Variables: RequestIdVariables }>()

// Middleware
app.use('*', requestId())
app.use('*', logger((message: string) => {
  // Parse the default Hono logger format to extract info
  const match = message.match(/(-->|<--) (\w+) ([^ ]+)(?: (\d+))?(?: (\d+(?:\.\d+)?(?:ms|s)))?/)
  if (!match) {
    console.log(message)
    return
  }

  const [, direction, method, path, status, time] = match

  if (direction === '-->') {
    // Response log
    console.log(JSON.stringify({
      type: 'response',
      method,
      path,
      status: status ? parseInt(status) : undefined,
      duration: time,
      timestamp: new Date().toISOString()
    }))
  }
}))
app.use('*', cors({
  origin: config.security.corsOrigins,
  credentials: true
}))

// Error handler
app.onError((error, ctx) => {
  const requestId = ctx.get('requestId')

  if (error instanceof HTTPException) {
    console.error(JSON.stringify({
      type: 'error',
      requestId,
      error: error.message,
      status: error.status,
      method: ctx.req.method,
      path: ctx.req.path,
      timestamp: new Date().toISOString()
    }))
    return ctx.json({ error: error.message, requestId }, error.status)
  }

  console.error(JSON.stringify({
    type: 'error',
    requestId,
    error: error.message,
    stack: error.stack,
    method: ctx.req.method,
    path: ctx.req.path,
    timestamp: new Date().toISOString()
  }))

  return ctx.json({
    error: 'Internal Server Error',
    requestId
  }, 500)
})

// Routes
app.get('/', (c) => c.text('Welcome to the URL Shortener API'))
app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/', userRoute)
app.route('/', linkRoute)

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
