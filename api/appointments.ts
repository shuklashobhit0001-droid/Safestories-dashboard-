import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(`
      SELECT 
        booking_invitee_time,
        booking_resource_name,
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_mode,
        booking_start_at
      FROM bookings
      ORDER BY booking_start_at DESC
    `);

    const convertToIST = (timeStr: string) => {
      const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
      if (!match) return timeStr;
      
      const [, date, startTime, endTime, offset] = match;
      const parseTime = (time: string, dateStr: string, tz: string) => {
        const [h, rest] = time.split(':');
        const [m, period] = rest.split(' ');
        let hour = parseInt(h);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const [offsetHours, offsetMins] = tz.replace('GMT', '').split(':').map(n => parseInt(n));
        const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
        const istOffset = 330;
        const diff = istOffset - offsetTotal;
        
        let totalMins = hour * 60 + parseInt(m) + diff;
        const newHour = Math.floor(totalMins / 60) % 24;
        const newMin = totalMins % 60;
        
        const period12 = newHour >= 12 ? 'PM' : 'AM';
        const hour12 = newHour % 12 || 12;
        return `${hour12}:${newMin.toString().padStart(2, '0')} ${period12}`;
      };
      
      const istStart = parseTime(startTime, date, `GMT${offset}`);
      const istEnd = parseTime(endTime, date, `GMT${offset}`);
      
      return `${date} at ${istStart} - ${istEnd} IST`;
    };

    const appointments = result.rows.map(row => ({
      ...row,
      booking_start_at: convertToIST(row.booking_invitee_time),
      booking_mode: row.booking_mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}
