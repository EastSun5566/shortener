import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { signToken, verifyToken } from '../../services/token'

describe('JWT Token Service', () => {
  const testPayload = {
    email: 'test@example.com',
    id: 1
  }

  it('should sign a token with payload', () => {
    const token = signToken(testPayload)

    assert.ok(token)
    assert.strictEqual(typeof token, 'string')
    assert.strictEqual(token.split('.').length, 3) // JWT has 3 parts
  })

  it('should verify and decode a valid token', () => {
    const token = signToken(testPayload)
    const decoded = verifyToken(token)

    assert.strictEqual(decoded.email, testPayload.email)
    assert.strictEqual(decoded.id, testPayload.id)
    assert.ok(decoded.iat)
    assert.ok(decoded.exp)
  })

  it('should include expiration time', () => {
    const token = signToken(testPayload)
    const decoded = verifyToken(token)

    const now = Math.floor(Date.now() / 1000)
    const sevenDaysLater = now + (7 * 24 * 3600)

    assert.ok(decoded.exp)
    assert.ok(decoded.exp > now)
    assert.ok(decoded.exp <= sevenDaysLater + 10) // Allow 10s tolerance
  })

  it('should throw error for invalid token', () => {
    assert.throws(() => {
      verifyToken('invalid.token.here')
    })
  })

  it('should throw error for tampered token', () => {
    const token = signToken(testPayload)
    const tamperedToken = token.slice(0, -5) + 'xxxxx'

    assert.throws(() => {
      verifyToken(tamperedToken)
    })
  })
})
