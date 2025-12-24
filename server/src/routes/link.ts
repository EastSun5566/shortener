import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'

import {
  createLink,
  createShortenKey,
  findLinkByShortenKey,
  findLinksByUserId,
  getLinkFromCache,
  setLinkFromCache,
  verifyToken
} from '../services/index.js'

const createLinkSchema = z.object({
  originalUrl: z.url('Invalid URL format')
})

const app = new Hono()
  .get('/links', async (c) => {
    // check authorization
    const token = c.req.header('authorization')?.split(' ')[1]
    if (!token) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    // get links from database
    const userId = verifyToken(token).id
    const links = await findLinksByUserId(userId)

    return c.json(links.map(({ shortenKey }) => ({
      shortenUrl: `${new URL(c.req.url).origin}/${shortenKey}`
    })))
  })
  .post('/links', zValidator('json', createLinkSchema), async (c) => {
    const { originalUrl } = c.req.valid('json')

    // create shortenKey
    const shortenKey = await createShortenKey()

    // get user id from token if present
    const token = c.req.header('authorization')?.split(' ')[1]
    const userId = token ? verifyToken(token).id : undefined

    // insert into database
    await createLink({
      originalUrl,
      shortenKey,
      ...(userId && { userId })
    })

    // add to cache
    await setLinkFromCache(shortenKey, originalUrl)

    return c.json({
      shortenUrl: `${new URL(c.req.url).origin}/${shortenKey}`
    }, 201)
  })
  .get('/:shortenKey', async (c) => {
    const { shortenKey } = c.req.param()

    // get from cache
    const cachedUrl = await getLinkFromCache(shortenKey)
    if (cachedUrl) {
      return c.redirect(cachedUrl)
    }

    // get from database
    const link = await findLinkByShortenKey(shortenKey)
    if (!link) {
      throw new HTTPException(404, { message: 'Link not found' })
    }

    // add to cache
    await setLinkFromCache(shortenKey, link.originalUrl)

    return c.redirect(link.originalUrl)
  })

export const linkRoute = app
export type LinkRouteType = typeof app
export default app
