import { Request, Response } from 'express';
import pool from './lib/db.js';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT booking_invitee_time
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
    `);

    let liveCount = 0;
    const nowUTC = new Date();

    result.rows.forEach(row => {
      const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        const startTimeStr = timeMatch[1];
        const endTimeStr = timeMatch[2];
        
        if (dateStr) {
          const startIST = new Date(`${dateStr} ${startTimeStr} GMT+0530`);
          const endIST = new Date(`${dateStr} ${endTimeStr} GMT+0530`);
          
          if (nowUTC >= startIST && nowUTC <= endIST) {
            liveCount++;
          }
        }
      }
    });

    res.json({ liveCount });
  } catch (error) {
    console.error('Error fetching live sessions count:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions count' });
  }
}
