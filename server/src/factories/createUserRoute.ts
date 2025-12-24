import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { rateLimiter } from 'hono-rate-limiter'
import type { AppDependencies } from '../types/services.js'

const authSchema = z.object({
  email: z.email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain at least one letter and one number')
})

// Rate limit: 5 requests per minute for auth endpoints
const authRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
  keyGenerator: (c) => c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
})

export function createUserRoute (deps: AppDependencies) {
  const { userService, tokenService, utilsService, config } = deps

  return new Hono()
    .post('/register', authRateLimiter, zValidator('json', authSchema), async (ctx) => {
      const { email, password } = ctx.req.valid('json')

      // check if email is already registered
      const existingUser = await userService.findUserByEmail(email)
      if (existingUser) {
        throw new HTTPException(409, { message: 'Registration failed. Please try again.' })
      }

      // hash password
      const hashedPassword = await utilsService.hashPassword(password, config.security.bcryptSaltRounds)

      // save user to database
      const { id } = await userService.createUser(email, hashedPassword)

      // generate JWT
      const token = tokenService.signToken({ email, id })

      return ctx.json({ token })
    })
    .post('/login', authRateLimiter, zValidator('json', authSchema), async (ctx) => {
      const { email, password } = ctx.req.valid('json')

      // check if email exists
      const user = await userService.findUserByEmail(email)
      if (!user) {
        throw new HTTPException(401, { message: 'Invalid email or password' })
      }

      // compare password
      const isPasswordValid = await utilsService.comparePassword(password, user.password)
      if (!isPasswordValid) {
        throw new HTTPException(401, { message: 'Invalid email or password' })
      }

      // generate JWT
      const token = tokenService.signToken({ email, id: user.id })

      return ctx.json({ token })
    })
}
