import { db } from '../drizzle/db.js'

export async function getDbClient () {
  return db
}
