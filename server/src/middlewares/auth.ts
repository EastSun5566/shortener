import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verifyToken } from '../services/index.js'

export interface AuthVariables {
  userId: number
  email: string
}

export const auth = createMiddleware<{ Variables: AuthVariables }>(async (ctx, next) => {
  const authHeader = ctx.req.header('authorization')
  if (!authHeader) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  try {
    const payload = verifyToken(token)
    ctx.set('userId', payload.id)
    ctx.set('email', payload.email)
    await next()
  } catch {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
})

export const optionalAuth = createMiddleware<{ Variables: Partial<AuthVariables> }>(async (ctx, next) => {
  const authHeader = ctx.req.header('authorization')
  if (!authHeader) {
    await next()
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    await next()
    return
  }

  try {
    const payload = verifyToken(token)
    ctx.set('userId', payload.id)
    ctx.set('email', payload.email)
  } catch {
    // Ignore invalid token for optional auth
  }

  await next()
})
