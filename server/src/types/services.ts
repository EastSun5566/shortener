export interface UserService {
  createUser: (email: string, hashedPassword: string) => Promise<{ id: number }>
  findUserByEmail: (email: string) => Promise<{ id: number, email: string, password: string } | undefined>
}

export interface LinkService {
  createLink: (data: { originalUrl: string, shortenKey: string, userId?: number }) => Promise<void>
  findLinkByShortenKey: (shortenKey: string) => Promise<{ originalUrl: string, userId: number | null } | undefined>
  findLinkByOriginalUrl: (originalUrl: string, userId?: number) => Promise<{ originalUrl: string, shortenKey: string, userId: number | null } | undefined>
  findLinksByUserId: (userId: number) => Promise<{ shortenKey: string, clickCount: number }[]>
}

export interface CacheService {
  get: (shortenKey: string) => Promise<{ originalUrl: string, userId: number | null } | null>
  set: (shortenKey: string, originalUrl: string, userId?: number | null) => Promise<void>
}

export interface TokenService {
  signToken: (payload: { email: string, id: number }) => string
  verifyToken: (token: string) => { email: string, id: number }
}

export interface UtilsService {
  createShortenKey: () => Promise<string>
  incrementClickCount: (shortenKey: string) => Promise<number>
  hashPassword: (password: string, saltRounds: number) => Promise<string>
  comparePassword: (password: string, hash: string) => Promise<boolean>
}

export interface AppDependencies {
  userService: UserService
  linkService: LinkService
  cacheService: CacheService
  tokenService: TokenService
  utilsService: UtilsService
  config: {
    security: {
      bcryptSaltRounds: number
      corsOrigins: string[]
    }
  }
}
