import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

describe('Password Hashing', () => {
  const testPassword = 'Test123!@#Password'
  const saltRounds = 12

  it('should hash password with configured salt rounds', async () => {
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds)

    assert.ok(hashedPassword)
    assert.notStrictEqual(hashedPassword, testPassword)
    assert.ok(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$'))
  })

  it('should verify correct password', async () => {
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds)
    const isValid = await bcrypt.compare(testPassword, hashedPassword)

    assert.strictEqual(isValid, true)
  })

  it('should reject incorrect password', async () => {
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds)
    const isValid = await bcrypt.compare('wrongPassword', hashedPassword)

    assert.strictEqual(isValid, false)
  })

  it('should generate different hashes for same password', async () => {
    const hash1 = await bcrypt.hash(testPassword, saltRounds)
    const hash2 = await bcrypt.hash(testPassword, saltRounds)

    assert.notStrictEqual(hash1, hash2)
    assert.strictEqual(await bcrypt.compare(testPassword, hash1), true)
    assert.strictEqual(await bcrypt.compare(testPassword, hash2), true)
  })

  it('should use configured salt rounds (12 by default)', async () => {
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds)

    // Extract salt rounds from hash (format: $2a$10$... where 10 is the rounds)
    const extractedSaltRounds = parseInt(hashedPassword.split('$')[2])

    assert.strictEqual(extractedSaltRounds, saltRounds)
    assert.ok(saltRounds >= 10)
    assert.ok(saltRounds <= 15)
  })
})
