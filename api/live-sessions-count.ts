import { Request, Response } from 'express';
import db from '../lib/db';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bookings = await db.all(`
      SELECT booking_id, session_timings, booking_status
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'no_show')
      AND session_timings IS NOT NULL
    `);

    const now = new Date();
    let liveCount = 0;

    for (const booking of bookings) {
      const timeMatch = booking.session_timings.match(/([\w]+, [\w]+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M)/);
      
      if (timeMatch) {
        const [, dateStr, startTimeStr, endTimeStr] = timeMatch;
        const startDateTime = new Date(`${dateStr} ${startTimeStr}`);
        const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
        
        if (now >= startDateTime && now <= endDateTime) {
          liveCount++;
        }
      }
    }

    res.json({ liveCount });
  } catch (error) {
    console.error('Error fetching live sessions count:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions count' });
  }
}
