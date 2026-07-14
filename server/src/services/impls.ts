import { hash, compare } from 'bcryptjs'
import type {
  UserService,
  LinkService,
  CacheService,
  TokenService,
  UtilsService
} from '../types/services.ts'

import * as userSvc from './user.ts'
import * as linkSvc from './link.ts'
import * as tokenSvc from './token.ts'
import { getCacheClient } from './cache.ts'
import { createShortenKey } from './link.ts'
import { config } from '../config.ts'

export const userService: UserService = {
  createUser: userSvc.createUser,
  findUserByEmail: userSvc.findUserByEmail
}

export const linkService: LinkService = {
  createLink: async (data) => {
    await linkSvc.createLink(data)
  },
  findLinkByShortenKey: linkSvc.findLinkByShortenKey,
  findLinkByOriginalUrl: linkSvc.findLinkByOriginalUrl,
  findLinksByUserId: linkSvc.findLinksByUserId
}

export const cacheService: CacheService = {
  get: async (shortenKey: string) => {
    const client = await getCacheClient()
    const data = await client.get(`link:${shortenKey}`)
    if (!data) return null
    try {
      return JSON.parse(data) as { originalUrl: string; userId: number | null }
    } catch {
      // Fallback for old cache format (plain string)
      return { originalUrl: data, userId: null }
    }
  },
  set: async (shortenKey: string, originalUrl: string, userId?: number | null) => {
    const client = await getCacheClient()
    const data = JSON.stringify({ originalUrl, userId: userId ?? null })
    await client.setEx(`link:${shortenKey}`, config.cache.linkTtl, data)
  }
}

export const tokenService: TokenService = {
  signToken: tokenSvc.signToken,
  verifyToken: tokenSvc.verifyToken
}

export const utilsService: UtilsService = {
  createShortenKey,
  incrementClickCount: linkSvc.incrementClickCount,
  hashPassword: hash,
  comparePassword: compare
}
