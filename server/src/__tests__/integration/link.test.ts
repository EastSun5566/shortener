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
      assert.strictEqual(cached, 'https://example.com/long-url')
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

      // Seed cache
      await deps.cacheService.set('testkey', 'https://example.com')

      const res = await app.request('/testkey', {
        redirect: 'manual'
      })

      assert.strictEqual(res.status, 302)
      assert.strictEqual(res.headers.get('location'), 'https://example.com')
    })

    it('should redirect to original URL from database', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)
      const linkService = deps.linkService as MockLinkService

      // Seed database
      linkService.addLink({
        shortenKey: 'dbkey',
        originalUrl: 'https://example.com/from-db'
      })

      const res = await app.request('/dbkey', {
        redirect: 'manual'
      })

      assert.strictEqual(res.status, 302)
      assert.strictEqual(res.headers.get('location'), 'https://example.com/from-db')

      // Verify it was cached
      const cached = await deps.cacheService.get('dbkey')
      assert.strictEqual(cached, 'https://example.com/from-db')
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
