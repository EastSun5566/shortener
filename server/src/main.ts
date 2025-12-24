import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'

import {
  linkRoute,
  userRoute
} from './routes/index.js'
import { config } from './config.js'

const app = new Hono()

// Middleware
app.use(logger())
app.use('*', cors({
  origin: config.security.corsOrigins,
  credentials: true
}))

// Error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Routes
app.get('/', (c) => c.text('Welcome to the URL Shortener API'))
app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/', userRoute)
app.route('/', linkRoute)

export async function main (): Promise<void> {
  // Start server
  serve({
    fetch: app.fetch,
    port: config.server.port
  }, (info) => {
    console.log(`Server is running on http://${config.server.host}:${info.port}`)
  })
}

main()

export type AppType = typeof app
