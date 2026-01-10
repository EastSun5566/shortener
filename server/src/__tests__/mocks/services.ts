import type {
  UserService,
  LinkService,
  CacheService,
  TokenService,
  UtilsService,
  AppDependencies
} from '../../types/services.js'

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

export class MockUserService implements UserService {
  private users: { id: number, email: string, password: string }[] = []

  createUser = async (email: string, hashedPassword: string) => {
    const id = this.users.length + 1
    this.users.push({ id, email, password: hashedPassword })
    return { id }
  }

  findUserByEmail = async (email: string) => {
    return this.users.find(u => u.email === email)
  }

  // Test helper
  reset () {
    this.users = []
  }
}

export class MockLinkService implements LinkService {
  private links: { originalUrl: string, shortenKey: string, userId?: number }[] = []

  createLink = async (data: { originalUrl: string, shortenKey: string, userId?: number }) => {
    this.links.push(data)
  }

  findLinkByShortenKey = async (shortenKey: string) => {
    const link = this.links.find(l => l.shortenKey === shortenKey)
    return link ? { originalUrl: link.originalUrl, userId: link.userId } : undefined
  }

  findLinkByOriginalUrl = async (originalUrl: string, userId?: number) => {
    const link = this.links.find(l => {
      if (userId !== undefined) {
        return l.originalUrl === originalUrl && l.userId === userId
      }
      return l.originalUrl === originalUrl
    })
    return link ? { originalUrl: link.originalUrl, shortenKey: link.shortenKey, userId: link.userId } : undefined
  }

  findLinksByUserId = async (userId: number) => {
    return this.links
      .filter(l => l.userId === userId)
      .map(l => ({ shortenKey: l.shortenKey }))
  }

  // Test helper
  reset () {
    this.links = []
  }

  // Test helper to seed data
  addLink (data: { originalUrl: string, shortenKey: string, userId?: number }) {
    this.links.push(data)
  }
}

export class MockCacheService implements CacheService {
  private readonly cache = new Map<string, string>()

  get = async (shortenKey: string) => {
    return this.cache.get(shortenKey) ?? null
  }

  set = async (shortenKey: string, originalUrl: string) => {
    this.cache.set(shortenKey, originalUrl)
  }

  // Test helper
  reset () {
    this.cache.clear()
  }
}

export class MockTokenService implements TokenService {
  private readonly validTokens = new Map<string, { email: string, id: number }>()

  signToken = (payload: { email: string, id: number }): string => {
    const token = `mock-token-${Date.now()}-${Math.random()}`
    this.validTokens.set(token, payload)
    return token
  }

  verifyToken = (token: string): { email: string, id: number } => {
    const payload = this.validTokens.get(token)
    if (!payload) {
      throw new Error('Invalid token')
    }
    return payload
  }

  // Test helper
  reset () {
    this.validTokens.clear()
  }

  // Test helper to create a valid token
  createValidToken (email: string, id: number): string {
    const token = `test-token-${id}`
    this.validTokens.set(token, { email, id })
    return token
  }
}

export class MockUtilsService implements UtilsService {
  private keyCounter = 0

  createShortenKey = async (): Promise<string> => {
    this.keyCounter++
    return `key${this.keyCounter.toString().padStart(6, '0')}`
  }

  hashPassword = async (password: string, _saltRounds: number): Promise<string> => {
    // Simple mock hash
    return `hashed-${password}`
  }

  comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return hash === `hashed-${password}`
  }

  // Test helper
  reset () {
    this.keyCounter = 0
  }
}

export function createMockDependencies (): AppDependencies {
  return {
    userService: new MockUserService(),
    linkService: new MockLinkService(),
    cacheService: new MockCacheService(),
    tokenService: new MockTokenService(),
    utilsService: new MockUtilsService(),
    config: {
      security: {
        bcryptSaltRounds: 12,
        corsOrigins: ['http://localhost:5173']
      }
    }
  }
}
