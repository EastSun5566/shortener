import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { fileURLToPath } from 'node:url'

import * as schema from './schema.js'
import { config } from '../config.js'

export const pool = new Pool({
  connectionString: config.db.url,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

// Error handling for pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err)
})

export const db = drizzle({ client: pool, schema })

export async function initDb() {
  console.log('🔧 Initializing database connection...')
  
  const client = await pool.connect()
  try {
    const result = await client.query<{ now: Date }>('SELECT NOW()')
    console.log(`✅ Database connected successfully at ${result.rows[0].now.toISOString()}`)
  } finally {
    client.release()
  }
}

export async function migrateDb () {
  const migrationsFolder = fileURLToPath(new URL('.', import.meta.url))
  console.log('🔧 Running database migrations...')
  await migrate(db, { migrationsFolder })
  console.log('✅ Database migrations completed')
}

export async function closeDb() {
  await pool.end()
  console.log('✅ Database connection closed')
}

export async function checkDbHealth() {
  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      return true
    } finally {
      client.release()
    }
  } catch {
    return false
  }
}
