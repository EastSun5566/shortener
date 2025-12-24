import type { Context } from 'hono'
import { hash, compare } from 'bcryptjs'

import {
  createUser,
  findUserByEmail,
  signToken
} from '../services/index.js'
import { isValidEmail } from '../utils.js'
import { config } from '../config.js'

export async function handleRegister (
  ctx: Context
) {
  const { email, password } = await ctx.req.json<{ email: string, password: string }>()

  // 1. validate email and password
  if (!email || !isValidEmail(email) || !password) {
    return ctx.text('Email or password is invalid', 400)
  }

  // 2. check if email is already registered
  const user = await findUserByEmail(email)
  if (user) {
    return ctx.text('Email is already registered', 400)
  }

  // 3. hash password
  const hashedPassword = await hash(password, config.security.bcryptSaltRounds)

  // 4. save user to database
  const { id } = await createUser(email, hashedPassword)

  // 5. generate JWT
  const token = signToken({ email, id })

  return ctx.json({ token })
}

export async function handleLogin (
  ctx: Context
) {
  const { email, password } = await ctx.req.json<{ email: string, password: string }>()

  // 1. validate email and password
  if (!email || !isValidEmail(email) || !password) {
    return ctx.text('Email or password is invalid', 400)
  }

  // 2. check if email is exists
  const user = await findUserByEmail(email)
  if (!user) {
    return ctx.text('Email is not registered', 400)
  }

  // 3. compare password
  const isPasswordCorrect = await compare(password, user.password)
  if (!isPasswordCorrect) {
    return ctx.text('Unauthorized', 401)
  }

  // 4. generate JWT
  const token = signToken({ email, id: user.id })

  return ctx.json({ token })
}
