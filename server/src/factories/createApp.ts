import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId, type RequestIdVariables } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'
import { HTTPException } from 'hono/http-exception'
import { serveStatic } from '@hono/node-server/serve-static'

import type { AppDependencies } from '../types/services.ts'
import { createUserRoute } from './createUserRoute.ts'
import { createLinkRoute } from './createLinkRoute.ts'
import { healthRoute } from '../routes/health.ts'

export function createApp (deps: AppDependencies) {
  const app = new Hono<{ Variables: RequestIdVariables }>()

  // Middleware
  app.use('*', requestId())
  app.use('*', secureHeaders())
  app.use('*', timeout(30000)) // 30 seconds timeout
  app.use('*', logger((message: string) => {
    // Parse the default Hono logger format to extract info
    const match = /(-->|<--) (\w+) ([^ ]+)(?: (\d+))?(?: (\d+(?:\.\d+)?(?:ms|s)))?/.exec(message)
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
    origin: deps.config.security.corsOrigins,
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
  app.route('/', healthRoute)
  app.route('/', createUserRoute(deps))

  // Serve static files in production
  if (deps.config.nodeEnv === 'production') {
    app.use('/*', serveStatic({ root: './web/dist' }))
    const serveIndex = serveStatic({ path: './web/dist/index.html' })
    app.get('/', serveIndex)
    app.get('/login', serveIndex)
    app.get('/register', serveIndex)
  }

  // Keep the top-level short-link route after reserved SPA routes.
  app.route('/', createLinkRoute(deps))

  return app
}
