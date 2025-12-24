import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { rateLimiter } from 'hono-rate-limiter'

import {
  createLink,
  createShortenKey,
  findLinkByShortenKey,
  findLinksByUserId,
  getLinkFromCache,
  setLinkFromCache
} from '../services/index.js'
import { auth, optionalAuth } from '../middlewares/index.js'

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

export const linkRoute = new Hono()
  .get('/links', auth, async (c) => {
    // get links from database
    const userId = c.get('userId')
    const links = await findLinksByUserId(userId)

    return c.json(links.map(({ shortenKey }) => ({
      shortenUrl: `${new URL(c.req.url).origin}/${shortenKey}`
    })))
  })
  .post('/links', linkRateLimiter, optionalAuth, zValidator('json', createLinkSchema), async (ctx) => {
    const { originalUrl } = ctx.req.valid('json')

    // create shortenKey
    const shortenKey = await createShortenKey()

    // get user id from context if authenticated
    const userId = ctx.get('userId')

    // insert into database
    await createLink({
      originalUrl,
      shortenKey,
      ...(userId && { userId })
    })

    // add to cache
    await setLinkFromCache(shortenKey, originalUrl)

    return ctx.json({
      shortenUrl: `${new URL(ctx.req.url).origin}/${shortenKey}`
    }, 201)
  })
  .get('/:shortenKey', async (ctx) => {
    const { shortenKey } = ctx.req.param()

    // get from cache
    const cachedUrl = await getLinkFromCache(shortenKey)
    if (cachedUrl) {
      return ctx.redirect(cachedUrl)
    }

    // get from database
    const link = await findLinkByShortenKey(shortenKey)
    if (!link) {
      throw new HTTPException(404, { message: 'Link not found' })
    }

    // add to cache
    await setLinkFromCache(shortenKey, link.originalUrl)

    return ctx.redirect(link.originalUrl)
  })
