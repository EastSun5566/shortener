import BloomFilterClass from 'bloom-filters'
import { getCacheClient } from './cache.js'
import { db } from '../drizzle/db.js'
import { links } from '../drizzle/schema.js'

const BLOOM_FILTER_KEY = 'api:bloomFilter:shortenKeys'
const EXPECTED_ITEMS = 10_000_000
const ERROR_RATE = 0.01

// BloomFilter.create(expectedItems, errorRate) automatically calculates:
// - Optimal size: m = -n*ln(p) / (ln(2)^2) ≈ 119,808,035 bits for 10M items at 1% error
// - Optimal hash functions: k = (m/n) * ln(2) ≈ 7 functions

const BloomFilter = BloomFilterClass.BloomFilter

let bloomFilter: InstanceType<typeof BloomFilter> | null = null

export async function initBloomFilter() {
  if (bloomFilter) return bloomFilter

  const cache = await getCacheClient()
  const cached = await cache.get(BLOOM_FILTER_KEY)
  if (cached) {
    try {
      const data = JSON.parse(cached) as Record<string, unknown>
      const loadedFilter = BloomFilter.fromJSON(data as never) as InstanceType<typeof BloomFilter>
      bloomFilter = loadedFilter
      console.log('✅ Bloom Filter loaded from cache')
      if (bloomFilter) return bloomFilter
    } catch (error) {
      console.warn('⚠️ Failed to load Bloom Filter from cache, rebuilding...', error)
    }
  }

  console.log('🔧 Building Bloom Filter from database...')
  bloomFilter = BloomFilter.create(EXPECTED_ITEMS, ERROR_RATE)

  const allLinks = await db.select({ shortenKey: links.shortenKey }).from(links)
  for (const link of allLinks) {
    bloomFilter.add(link.shortenKey)
  }

  await saveBloomFilter()

  console.log(`✅ Bloom Filter initialized with ${allLinks.length} keys`)
  return bloomFilter
}

export async function mightExist(shortenKey: string): Promise<boolean> {
  const filter = await getBloomFilter()
  return filter.has(shortenKey)
}

export async function addKey(shortenKey: string): Promise<void> {
  const filter = await getBloomFilter()
  filter.add(shortenKey)
  
  await saveBloomFilter()
}

export async function getBloomFilter() {
  if (!bloomFilter) {
    return await initBloomFilter()
  }
  return bloomFilter
}

async function saveBloomFilter(): Promise<void> {
  if (!bloomFilter) return

  const cache = await getCacheClient()
  const data = JSON.stringify(bloomFilter.saveAsJSON())
  await cache.set(BLOOM_FILTER_KEY, data)
}

export async function clearBloomFilter(): Promise<void> {
  bloomFilter = null
  const cache = await getCacheClient()
  await cache.del(BLOOM_FILTER_KEY)
}
