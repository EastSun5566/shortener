import { sign, verify, type JwtPayload } from 'jsonwebtoken'
import { config } from '../config'

interface TokenPayload {
  email: string
  id: number
}

export function signToken (payload: TokenPayload) {
  return sign(payload, config.security.jwtSecret, {
    expiresIn: config.security.jwtExpiresIn
  })
}

export function verifyToken (token: string) {
  return verify(token, config.security.jwtSecret) as (TokenPayload & JwtPayload)
}
