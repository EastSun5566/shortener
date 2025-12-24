import jwt from 'jsonwebtoken'

import { config } from '../config.js'

interface TokenPayload {
  email: string
  id: number
}

export function signToken (payload: TokenPayload) {
  return jwt.sign(payload, config.security.jwtSecret, {
    expiresIn: config.security.jwtExpiresIn as jwt.SignOptions['expiresIn']
  })
}

export function verifyToken (token: string) {
  return jwt.verify(token, config.security.jwtSecret) as (TokenPayload & jwt.JwtPayload)
}
