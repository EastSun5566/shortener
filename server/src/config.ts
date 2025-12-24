import { validateEnv } from './validators/env.js'

const env = validateEnv()

export const config = {
  server: {
    host: env.HOST,
    port: env.PORT
  },
  cache: {
    host: env.CACHE_HOST ?? 'localhost',
    port: env.CACHE_PORT ?? 6379
  },
  db: {
    url: env.DATABASE_URL
  },
  security: {
    corsOrigins: env.CORS_ORIGINS ?? ['http://localhost:3000'],
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS
  },
  nodeEnv: env.NODE_ENV
}
