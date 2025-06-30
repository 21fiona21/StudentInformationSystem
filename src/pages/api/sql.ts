// src/pages/api/sql.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'

// Create a connection pool for PostgreSQL using DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// API handler for executing raw SQL queries sent from frontend
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read and trim the SQL query from request body
    const query = req.body.query?.trim()
    console.log('QUERY RECEIVED:', query)

    // Validate that a query string is provided
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'No valid SQL query provided.' })
    }

    // Connect to the database
    const client = await pool.connect()
    try {
      // Execute the SQL query
      const result = await client.query(query)
      // Return the query result rows as JSON
      res.status(200).json({ data: result.rows })
    } finally {
      // Release the database client back to the pool
      client.release()
    }
  } catch (err: any) {
    // Handle and return any unexpected errors
    res.status(500).json({ error: err.message || 'Unexpected error' })
  }
}