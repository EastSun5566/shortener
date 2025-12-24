import { db } from '../drizzle/db.js'

export function getDbClient() {
  return db
}
