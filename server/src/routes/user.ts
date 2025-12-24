import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { hash, compare } from 'bcryptjs'
import { HTTPException } from 'hono/http-exception'
import { rateLimiter } from 'hono-rate-limiter'

import {
  createUser,
  findUserByEmail,
  signToken
} from '../services/index.js'
import { config } from '../config.js'

const authSchema = z.object({
  email: z.email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain at least one letter and one number')
})

// Rate limit: 5 requests per minute for auth endpoints
const authRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
  keyGenerator: (c) => c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
})

export const userRoute = new Hono()
  .post('/register', authRateLimit, zValidator('json', authSchema), async (c) => {
    const { email, password } = c.req.valid('json')

    // check if email is already registered
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      throw new HTTPException(409, { message: 'Registration failed. Please try again.' })
    }

    // hash password
    const hashedPassword = await hash(password, config.security.bcryptSaltRounds)

    // save user to database
    const { id } = await createUser(email, hashedPassword)

    // generate JWT
    const token = signToken({ email, id })

    return c.json({ token })
  })
  .post('/login', authRateLimit, zValidator('json', authSchema), async (c) => {
    const { email, password } = c.req.valid('json')

    // check if email exists
    const user = await findUserByEmail(email)
    if (!user) {
      throw new HTTPException(401, { message: 'Invalid email or password' })
    }

    // compare password
    const isPasswordCorrect = await compare(password, user.password)
    if (!isPasswordCorrect) {
      throw new HTTPException(401, { message: 'Invalid email or password' })
    }

    // generate JWT
    const token = signToken({ email, id: user.id })

    return c.json({ token })
  })
