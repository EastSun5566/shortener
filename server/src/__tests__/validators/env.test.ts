import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { validateEnv } from '../../validators/env'

describe('Environment Variables Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  it('should validate with all required variables', () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'this-is-a-very-long-secret-key-more-than-32-characters'
    }

    const result = validateEnv()

    assert.strictEqual(result.DATABASE_URL, 'postgresql://user:pass@localhost:5432/test')
    assert.strictEqual(result.JWT_SECRET, 'this-is-a-very-long-secret-key-more-than-32-characters')
    assert.strictEqual(result.HOST, 'localhost')
    assert.strictEqual(result.PORT, 8080)
  })

  it('should use default values for optional variables', () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'this-is-a-very-long-secret-key-more-than-32-characters'
    }

    const result = validateEnv()

    assert.strictEqual(result.JWT_EXPIRES_IN, '7d')
    assert.strictEqual(result.BCRYPT_SALT_ROUNDS, 12)
    assert.strictEqual(result.NODE_ENV, 'development')
  })

  it('should transform PORT to number', () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'this-is-a-very-long-secret-key-more-than-32-characters',
      PORT: '3000'
    }

    const result = validateEnv()

    assert.strictEqual(result.PORT, 3000)
    assert.strictEqual(typeof result.PORT, 'number')
  })

  it('should transform BCRYPT_SALT_ROUNDS to number', () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'this-is-a-very-long-secret-key-more-than-32-characters',
      BCRYPT_SALT_ROUNDS: '10'
    }

    const result = validateEnv()

    assert.strictEqual(result.BCRYPT_SALT_ROUNDS, 10)
    assert.strictEqual(typeof result.BCRYPT_SALT_ROUNDS, 'number')
  })

  it('should split CORS_ORIGINS into array', () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'this-is-a-very-long-secret-key-more-than-32-characters',
      CORS_ORIGINS: 'http://localhost:3000,http://localhost:5173'
    }

    const result = validateEnv()

    assert.deepStrictEqual(result.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:5173'])
  })

  it('should fail if DATABASE_URL is missing', () => {
    const originalEnv = process.env

    process.env = {
      JWT_SECRET: 'this-is-a-very-long-secret-key-more-than-32-characters'
    }

    const exitSpy = mock.method(process, 'exit', () => {
      throw new Error('process.exit called')
    })
    const consoleSpy = mock.method(console, 'error', () => {})

    assert.throws(() => validateEnv(), /process.exit called/)
    assert.strictEqual(exitSpy.mock.calls.length, 1)
    assert.strictEqual(exitSpy.mock.calls[0].arguments[0], 1)
    assert.ok(consoleSpy.mock.calls.length > 0)

    exitSpy.mock.restore()
    consoleSpy.mock.restore()
    process.env = originalEnv
  })

  it('should fail if JWT_SECRET is too short', () => {
    const originalEnv = process.env

    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'short'
    }

    const exitSpy = mock.method(process, 'exit', () => {
      throw new Error('process.exit called')
    })
    const consoleSpy = mock.method(console, 'error', () => {})

    assert.throws(() => validateEnv(), /process.exit called/)
    assert.strictEqual(exitSpy.mock.calls.length, 1)
    assert.strictEqual(exitSpy.mock.calls[0].arguments[0], 1)
    assert.ok(consoleSpy.mock.calls.length > 0)

    exitSpy.mock.restore()
    consoleSpy.mock.restore()
    process.env = originalEnv
  })

  it('should validate BCRYPT_SALT_ROUNDS range', () => {
    const originalEnv = process.env

    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'this-is-a-very-long-secret-key-more-than-32-characters',
      BCRYPT_SALT_ROUNDS: '16'
    }

    const exitSpy = mock.method(process, 'exit', () => {
      throw new Error('process.exit called')
    })
    const consoleSpy = mock.method(console, 'error', () => {})

    assert.throws(() => validateEnv(), /process.exit called/)
    assert.strictEqual(exitSpy.mock.calls.length, 1)

    exitSpy.mock.restore()
    consoleSpy.mock.restore()
    process.env = originalEnv
  })
})
