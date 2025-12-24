import { hash, compare } from 'bcryptjs'
import type {
  UserService,
  LinkService,
  CacheService,
  TokenService,
  UtilsService
} from '../types/services.js'

import * as userSvc from './user.js'
import * as linkSvc from './link.js'
import * as tokenSvc from './token.js'
import { getCacheClient } from './cache.js'
import { createShortenKey } from './link.js'
import { config } from '../config.js'

export const userService: UserService = {
  createUser: userSvc.createUser,
  findUserByEmail: userSvc.findUserByEmail
}

export const linkService: LinkService = {
  createLink: async (data) => {
    await linkSvc.createLink(data)
  },
  findLinkByShortenKey: linkSvc.findLinkByShortenKey,
  findLinksByUserId: linkSvc.findLinksByUserId
}

export const cacheService: CacheService = {
  get: async (shortenKey: string) => {
    const client = await getCacheClient()
    return await client.get(`link:${shortenKey}`)
  },
  set: async (shortenKey: string, originalUrl: string) => {
    const client = await getCacheClient()
    await client.setEx(`link:${shortenKey}`, config.cache.linkTtl, originalUrl)
  }
}

export const tokenService: TokenService = {
  signToken: tokenSvc.signToken,
  verifyToken: tokenSvc.verifyToken
}

export const utilsService: UtilsService = {
  createShortenKey,
  hashPassword: hash,
  comparePassword: compare
}
