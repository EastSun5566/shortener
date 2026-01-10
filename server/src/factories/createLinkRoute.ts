import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { rateLimiter } from 'hono-rate-limiter'
import type { AppDependencies } from '../types/services.js'
import { createAuthMiddleware, createOptionalAuthMiddleware } from './createAuthMiddleware.js'

const createLinkSchema = z.object({
  originalUrl: z.url('Invalid URL format')
    .min(10, 'URL too short')
    .max(2048, 'URL too long')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'Only HTTP/HTTPS URLs are allowed'
    )
})

// Rate limit: 20 requests per minute for link creation
const linkRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 20,
  keyGenerator: (c) => c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
})

export function createLinkRoute (deps: AppDependencies) {
  const { linkService, cacheService, utilsService, tokenService } = deps
  const auth = createAuthMiddleware(tokenService)
  const optionalAuth = createOptionalAuthMiddleware(tokenService)

  return new Hono()
    .get('/links', auth, async (c) => {
      // get links from database
      const userId = c.get('userId')
      const links = await linkService.findLinksByUserId(userId)

      return c.json(links.map(({ shortenKey }) => ({
        shortenUrl: `${new URL(c.req.url).origin}/${shortenKey}`
      })))
    })
    .post('/links', linkRateLimiter, optionalAuth, zValidator('json', createLinkSchema), async (ctx) => {
      const { originalUrl } = ctx.req.valid('json')
      const userId = ctx.get('userId')

      // check for existing link
      const existingLink = await linkService.findLinkByOriginalUrl(originalUrl, userId)
      if (existingLink) {
        // return existing shorten URL to avoid duplication
        return ctx.json({
          shortenUrl: `${new URL(ctx.req.url).origin}/${existingLink.shortenKey}`,
          existed: true
        }, 200)
      }

      // create new shorten key
      const shortenKey = await utilsService.createShortenKey()

      await linkService.createLink({
        originalUrl,
        shortenKey,
        ...(userId && { userId })
      })
      await cacheService.set(shortenKey, originalUrl, userId)

      return ctx.json({
        shortenUrl: `${new URL(ctx.req.url).origin}/${shortenKey}`,
        existed: false
      }, 201)
    })
    .get('/:shortenKey', async (ctx) => {
      const { shortenKey } = ctx.req.param()

      // get from cache
      const cached = await cacheService.get(shortenKey)
      if (cached) {
        // Use 302 for user links (tracking), 301 for anonymous links (performance)
        const statusCode = cached.userId ? 302 : 301
        return ctx.redirect(cached.originalUrl, statusCode)
      }

      // get from database
      const link = await linkService.findLinkByShortenKey(shortenKey)
      if (!link) {
        throw new HTTPException(404, { message: 'Link not found' })
      }

      // add to cache
      await cacheService.set(shortenKey, link.originalUrl, link.userId)

      // If the link belongs to a logged-in user, use 302 (for tracking)
      // Otherwise, use 301 (to reduce server load)
      const statusCode = link.userId ? 302 : 301
      return ctx.redirect(link.originalUrl, statusCode)
    })
}
