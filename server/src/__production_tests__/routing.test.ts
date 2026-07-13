import { describe, it } from 'node:test'
import assert from 'node:assert'

import { createApp } from '../factories/createApp.js'
import { createMockDependencies } from '../__tests__/mocks/services.js'

describe('Production routing', () => {
  it('serves the SPA on reserved client routes', async () => {
    const deps = createMockDependencies()
    deps.config.nodeEnv = 'production'
    const app = createApp(deps)

    for (const path of ['/', '/login', '/register']) {
      const response = await app.request(path)
      const body = await response.text()

      assert.strictEqual(response.status, 200)
      assert.match(response.headers.get('content-type') ?? '', /^text\/html/)
      assert.match(body, /<!doctype html>/i)
    }
  })

  it('keeps unknown top-level paths in the short-link route', async () => {
    const deps = createMockDependencies()
    deps.config.nodeEnv = 'production'
    const app = createApp(deps)

    const response = await app.request('/missing-short-link')
    const body = await response.json() as { error: string }

    assert.strictEqual(response.status, 404)
    assert.strictEqual(body.error, 'Link not found')
  })
})
