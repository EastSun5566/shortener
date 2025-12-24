import type { Context } from 'hono'

import {
  createLink,
  createShortenKey,
  findLinkByShortenKey,
  findLinksByUserId,
  getLinkFromCache,
  setLinkFromCache,
  verifyToken
} from '../services/index.js'
import { isValidUrl } from '../utils.js'

export async function handleRedirect (
  ctx: Context
) {
  const { shortenKey } = ctx.req.param()

  // 1. get from cache
  const originalUrl = await getLinkFromCache(shortenKey)
  if (originalUrl) {
    return ctx.redirect(originalUrl)
  }

  // 2. get from database
  const link = await findLinkByShortenKey(shortenKey)
  if (!link) {
    return ctx.text('Link not found', 404)
  }

  // 3. add to cache
  await setLinkFromCache(shortenKey, link.originalUrl)

  return ctx.redirect(link.originalUrl)
}

export async function handleListLinks (
  ctx: Context
) {
  // 1. check authorization
  const token = ctx.req.header('authorization')?.split(' ')[1]
  if (!token) {
    return ctx.text('Unauthorized', 401)
  }

  // 2. get links from database
  const links = await findLinksByUserId(verifyToken(token).id)

  return ctx.json(links.map(({ shortenKey }) => ({
    shortenUrl: `http://${new URL(ctx.req.url).host}/${shortenKey}`
  })))
}

export async function handleCreateLink (
  ctx: Context
) {
  const { originalUrl } = await ctx.req.json<{ originalUrl: string }>()

  // 1. validate originalUrl
  if (!originalUrl || !isValidUrl(originalUrl)) {
    return ctx.text('Invalid URL', 400)
  }

  // 2. create shortenKey
  const shortenKey = await createShortenKey()

  // 3. insert into database
  const token = ctx.req.header('authorization')?.split(' ')[1]
  await createLink({
    originalUrl,
    shortenKey,
    ...(token && {
      userId: verifyToken(token).id
    })
  })

  // 4. add to cache
  await setLinkFromCache(shortenKey, originalUrl)

  return ctx.json({ shortenUrl: `http://${new URL(ctx.req.url).host}/${shortenKey}` }, 201)
}
