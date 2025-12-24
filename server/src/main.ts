import createApp from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import rateLimit from '@fastify/rate-limit'

import {
  linkRoute,
  userRoute
} from './routes'
import { config } from './config'

export async function main (): Promise<void> {
  const app = createApp({
    logger: {
      transport: {
        target: 'pino-pretty'
      }
    }
  })

  await app.register(sensible)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later.'
    })
  })
  await app.register(cors, {
    origin: config.security.corsOrigins,
    credentials: true
  })

  app.get('/', () => 'Welcome to the URL Shortener API')
  app.get('/health', () => ({ status: 'ok' }))
  app.register(userRoute)
  app.register(linkRoute)

  try {
    await app.listen({
      host: config.server.host,
      port: config.server.port
    })
  } catch (error: unknown) {
    app.log.error(error)
    process.exit(1)
  }
}

main()
