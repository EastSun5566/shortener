import { describe, it } from 'node:test'
import assert from 'node:assert'

import { isReservedShortenKey } from '../../services/link.ts'

describe('Short-link key reservations', () => {
  it('reserves application and asset routes', () => {
    for (const key of ['assets', 'health', 'links', 'login', 'register']) {
      assert.strictEqual(isReservedShortenKey(key), true)
    }
  })

  it('allows normal short-link keys', () => {
    assert.strictEqual(isReservedShortenKey('abc123'), false)
  })
})
