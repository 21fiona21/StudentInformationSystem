import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, role, phone, address } = req.body;

  if (!userId || !role || !['lecturer', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  const table = role === 'lecturer' ? 'lecturers' : 'students';

  try {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE ${table} SET phone = $1, address = $2 WHERE user_id = $3`,
        [phone, address, userId]
      );
      res.status(200).json({ message: 'Profile updated successfully' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}