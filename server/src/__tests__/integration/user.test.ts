import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createApp } from '../../factories/createApp.js'
import { createMockDependencies } from '../mocks/services.js'

describe('User Routes - Integration Tests', () => {
  describe('POST /register', () => {
    it('should register a new user and return a token', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json() as { token: string }
      assert.ok(data.token)
      assert.ok(data.token.startsWith('mock-token-'))

      // Verify user was created in database
      const user = await deps.userService.findUserByEmail('test@example.com')
      assert.ok(user)
      assert.strictEqual(user.email, 'test@example.com')
      assert.strictEqual(user.password, 'hashed-Password123')
    })

    it('should reject duplicate email registration', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      // First registration
      await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      // Duplicate registration
      const res = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'Password456'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 409)
      const data = await res.json() as { error: string }
      assert.strictEqual(data.error, 'Registration failed. Please try again.')
    })

    it('should reject invalid email format', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'Password123'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 400)
      const data = await res.json() as { error: { issues: { message: string }[] } }
      assert.ok(data.error)
    })

    it('should reject weak password (too short)', async () => {
      const deps = createMockDependencies()
      const app = createApp(deps)

      const res = await app.request('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak'
        }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      })

      assert.strictEqual(res.status, 400)
      const data = await res.json() as { error: { issues: { message: string }[] } }
      assert.ok(data.error)
    })
  })
})
