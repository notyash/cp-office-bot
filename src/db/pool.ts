import { Pool } from 'pg'
import { env } from '../utils/env.js'

export const pool = new Pool({
  connectionString: env.databaseUrl,
})

export async function checkDbConnection() {
  const client = await pool.connect()

  try {
    await client.query("SELECT 1")
  } catch (err) {
    console.error(`Database connection failed! ${err}`)
    throw err
  } finally {
    client.release()
  }
}