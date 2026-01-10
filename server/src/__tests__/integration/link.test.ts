import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createApp } from '../../factories/createApp.js'
import { createMockDependencies } from '../mocks/services.js'
import type { MockLinkService } from '../mocks/services.js'

describe('Link Routes - Integration Tests', () => {
  describe('POST /links', () => {
    it('should create a short link for authenticated user', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      // Register and get token
      const registerRes = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })
      const { token } = await registerRes.json() as { token: string }

      // Create link
      const res = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/long-url'
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      })

      assert.strictEqual(res.status, 201)
      const data = await res.json() as { shortenUrl: string }
      assert.ok(data.shortenUrl)
      assert.ok(data.shortenUrl.includes('/key'))

      // Verify link was created in database
      const link = await deps.linkService.findLinkByShortenKey('key000001')
      assert.ok(link)
      assert.strictEqual(link.originalUrl, 'https://example.com/long-url')

      // Verify link was cached
      const cached = await deps.cacheService.get('key000001')
      assert.deepStrictEqual(cached, { originalUrl: 'https://example.com/long-url', userId: 1 })
    })

    it('should create a short link for unauthenticated user', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/public-url'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 201)
      const data = await res.json() as { shortenUrl: string }
      assert.ok(data.shortenUrl)
    })

    it('should reject invalid URL format', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'not-a-valid-url'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 400)
    })

    it('should reject non-HTTP/HTTPS URLs', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'ftp://example.com/file'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 400)
    })

    it('should reject URL that is too short', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'http://a'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 400)
    })

    it('should reject URL that is too long', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const longUrl = 'https://example.com/' + 'a'.repeat(2050)
      const res = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: longUrl
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 400)
    })

    it('should return existing short URL for duplicate originalUrl (authenticated)', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      // Register and get token
      const registerRes = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })
      const { token } = await registerRes.json() as { token: string }

      // Create first link
      const firstRes = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/duplicate'
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      })

      assert.strictEqual(firstRes.status, 201)
      const firstData = await firstRes.json() as { shortenUrl: string, existed: boolean }
      assert.strictEqual(firstData.existed, false)

      // Try to create duplicate link
      const secondRes = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/duplicate'
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      })

      assert.strictEqual(secondRes.status, 200)
      const secondData = await secondRes.json() as { shortenUrl: string, existed: boolean }
      assert.strictEqual(secondData.existed, true)
      assert.strictEqual(secondData.shortenUrl, firstData.shortenUrl)
    })

    it('should create different short URLs for same originalUrl by different users', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      // Register first user
      const register1 = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user1@example.com',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })
      const { token: token1 } = await register1.json() as { token: string }

      // Register second user
      const register2 = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user2@example.com',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })
      const { token: token2 } = await register2.json() as { token: string }

      // User 1 creates link
      const res1 = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/shared'
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`
        })
      })

      const data1 = await res1.json() as { shortenUrl: string }

      // User 2 creates link with same URL
      const res2 = await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/shared'
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`
        })
      })

      const data2 = await res2.json() as { shortenUrl: string }

      // Different users should get different short URLs
      assert.notStrictEqual(data1.shortenUrl, data2.shortenUrl)
    })
  })

  describe('GET /links', () => {
    it('should return user links when authenticated', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      // Register and get token
      const registerRes = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })
      const { token } = await registerRes.json() as { token: string }

      // Create a link
      await app.request('/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com/1'
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      })

      // Get user links
      const res = await app.request('/links', {
        headers: new Headers({
          Authorization: `Bearer ${token}`
        })
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json() as { shortenUrl: string }[]
      assert.strictEqual(data.length, 1)
      assert.ok(data[0].shortenUrl.includes('/key'))
    })

    it('should require authentication', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/links')

      assert.strictEqual(res.status, 401)
      const data = await res.json() as { error: string }
      assert.strictEqual(data.error, 'Unauthorized')
    })

    it('should reject invalid token', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/links', {
        headers: new Headers({
          Authorization: 'Bearer invalid-token'
        })
      })

      assert.strictEqual(res.status, 401)
      const data = await res.json() as { error: string }
      assert.strictEqual(data.error, 'Unauthorized')
    })
  })

  describe('GET /:shortenKey', () => {
    it('should redirect to original URL from cache', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      // Seed cache (anonymous link, no userId)
      await deps.cacheService.set('testkey', 'https://example.com')

      const res = await app.request('/testkey', {
        redirect: 'manual'
      })

      assert.strictEqual(res.status, 301)
      assert.strictEqual(res.headers.get('location'), 'https://example.com')
    })

    it('should redirect to original URL from database', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)
      const linkService = deps.linkService as MockLinkService

      // Seed database (without userId, should use 301)
      linkService.addLink({
        shortenKey: 'dbkey',
        originalUrl: 'https://example.com/from-db'
      })

      const res = await app.request('/dbkey', {
        redirect: 'manual'
      })

      assert.strictEqual(res.status, 301)
      assert.strictEqual(res.headers.get('location'), 'https://example.com/from-db')

      // Verify it was cached
      const cached = await deps.cacheService.get('dbkey')
      assert.deepStrictEqual(cached, { originalUrl: 'https://example.com/from-db', userId: null })
    })

    it('should use 301 redirect for anonymous links', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)
      const linkService = deps.linkService as MockLinkService

      // Seed database with anonymous link (no userId)
      linkService.addLink({
        shortenKey: 'anonkey',
        originalUrl: 'https://example.com/anonymous'
      })

      const res = await app.request('/anonkey', {
        redirect: 'manual'
      })

      assert.strictEqual(res.status, 301)
      assert.strictEqual(res.headers.get('location'), 'https://example.com/anonymous')
    })

    it('should use 302 redirect for authenticated user links', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)
      const linkService = deps.linkService as MockLinkService

      // Seed database with user link (with userId)
      linkService.addLink({
        shortenKey: 'userkey',
        originalUrl: 'https://example.com/user-link',
        userId: 1
      })

      const res = await app.request('/userkey', {
        redirect: 'manual'
      })

      assert.strictEqual(res.status, 302)
      assert.strictEqual(res.headers.get('location'), 'https://example.com/user-link')
    })

    it('should return 404 for non-existent key', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/nonexistent')

      assert.strictEqual(res.status, 404)
      const data = await res.json() as { error: string }
      assert.strictEqual(data.error, 'Link not found')
    })
  })
})
