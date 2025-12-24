import { db } from '../drizzle/db'

export async function getDbClient () {
  return db
}
