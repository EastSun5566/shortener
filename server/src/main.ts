import createApp from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'

import { config as loadEnv } from 'dotenv'

import {
  linkRoute,
  userRoute
} from './routes'
import { config } from './config'

export async function main (): Promise<void> {
  loadEnv()

  const app = createApp({
    logger: {
      transport: {
        target: 'pino-pretty'
      }
    }
  })

  await app.register(sensible)
  await app.register(cors)

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
