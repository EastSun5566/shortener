import { z } from 'zod'

const envSchema = z.object({
  // Server
  HOST: z.string().default('localhost'),
  PORT: z.string().default('8080').transform(Number).pipe(z.number().positive()),

  // Cache (Redis)
  CACHE_HOST: z.string().optional(),
  CACHE_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  REDIS_URL: z.url().optional(),

  // Database
  DATABASE_URL: z.url(),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number).pipe(z.number().int().min(10).max(15)),
  CORS_ORIGINS: z.string().transform(str => str.split(',')).optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
})

export type Env = z.infer<typeof envSchema>

export function validateEnv () {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.issues.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

export function toBase62 (number: number) {
  if (number === 0) {
    return '0'
  }
  const digits = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  while (number > 0) {
    result = digits[number % digits.length] + result
    number = parseInt(`${number / digits.length}`, 10)
  }

  return result
}
