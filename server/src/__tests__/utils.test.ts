import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { toBase62 } from '../utils'

describe('Short URL Generation', () => {
  describe('toBase62', () => {
    it('should convert 0 to base62', () => {
      assert.strictEqual(toBase62(0), '0')
    })

    it('should convert positive numbers to base62', () => {
      assert.strictEqual(toBase62(1), '1')
      assert.strictEqual(toBase62(10), 'a')
      assert.strictEqual(toBase62(35), 'z')
      assert.strictEqual(toBase62(36), 'A')
      assert.strictEqual(toBase62(61), 'Z')
      assert.strictEqual(toBase62(62), '10')
      assert.strictEqual(toBase62(100), '1C')
    })

    it('should handle large numbers', () => {
      const result = toBase62(123456789)
      assert.ok(result)
      assert.ok(result.length > 0)
      assert.ok(/^[0-9a-zA-Z]+$/.test(result))
    })

    it('should produce consistent results', () => {
      const num = 987654
      assert.strictEqual(toBase62(num), toBase62(num))
    })
  })
})
