import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { TokenService } from '../types/services.js'

export interface AuthVariables {
  userId: number
  email: string
}

export function createAuthMiddleware (tokenService: TokenService) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    try {
      const { id, email } = tokenService.verifyToken(token)
      c.set('userId', id)
      c.set('email', email)
      await next()
    } catch {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
  })
}

export function createOptionalAuthMiddleware (tokenService: TokenService) {
  return createMiddleware<{ Variables: Partial<AuthVariables> }>(async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { id, email } = tokenService.verifyToken(token)
        c.set('userId', id)
        c.set('email', email)
      } catch {
        // If token is invalid, continue without auth
      }
    }
    await next()
  })
}
