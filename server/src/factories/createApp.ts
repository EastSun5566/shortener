import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId, type RequestIdVariables } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'
import { HTTPException } from 'hono/http-exception'

import type { AppDependencies } from '../types/services.js'
import { createUserRoute } from './createUserRoute.js'
import { createLinkRoute } from './createLinkRoute.js'
import { healthRoute } from '../routes/health.js'

export function createApp (deps: AppDependencies) {
  const app = new Hono<{ Variables: RequestIdVariables }>()

  // Middleware
  app.use('*', requestId())
  app.use('*', secureHeaders())
  app.use('*', timeout(30000)) // 30 seconds timeout
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
  app.route('/', createLinkRoute(deps))

  return app
}
