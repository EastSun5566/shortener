import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createApp } from '../../factories/createApp.js'
import { createMockDependencies } from '../mocks/services.js'
import type { MockLinkService } from '../mocks/services.js'

describe('Click Tracking Tests', () => {
  it('should increment click count on redirect', async () => {
    const deps = createMockDependencies()
    const app = createApp(deps)
    const linkService = deps.linkService as MockLinkService

    // Seed a link
    linkService.addLink({
      shortenKey: 'testkey',
      originalUrl: 'https://example.com'
    })

    // First redirect
    await app.request('/testkey', { redirect: 'manual' })
    
    // Verify click count incremented
    let count = await deps.utilsService.incrementClickCount('testkey')
    assert.ok(count > 0, 'Click count should be greater than 0 after first redirect')

    // Second redirect
    await app.request('/testkey', { redirect: 'manual' })
    
    // Verify click count incremented again
    count = await deps.utilsService.incrementClickCount('testkey')
    assert.ok(count > 1, 'Click count should increase with multiple redirects')
  })

  it('should return clickCount in GET /links', async () => {
    const deps = createMockDependencies()
    const app = createApp(deps)

    // Register and login
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
        originalUrl: 'https://example.com/test'
      }),
      headers: new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    })

    // Get links
    const linksRes = await app.request('/links', {
      headers: new Headers({
        Authorization: `Bearer ${token}`
      })
    })

    assert.strictEqual(linksRes.status, 200)
    const links = await linksRes.json() as { shortenUrl: string, clickCount: number }[]
    
    assert.ok(Array.isArray(links), 'Response should be an array')
    assert.ok(links.length > 0, 'Should have at least one link')
    assert.ok('clickCount' in links[0], 'Link should have clickCount property')
    assert.strictEqual(typeof links[0].clickCount, 'number', 'clickCount should be a number')
  })
})
