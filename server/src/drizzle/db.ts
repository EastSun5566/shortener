import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { config } from '../config'

export const pool = new Pool({
  connectionString: config.db.url
})

export const db = drizzle({ client: pool, schema })
