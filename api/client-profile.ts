import { Request, Response } from 'express';
import pool from '../lib/db';

export async function getClientProfile(req: Request, res: Response) {
  try {
    const { userId } = req.query;

    const userResult = await pool.query(
      'SELECT id, username, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const bookingResult = await pool.query(
      `SELECT invitee_phone, invitee_email, emergency_contact_name, emergency_contact_number 
       FROM bookings 
       WHERE invitee_name ILIKE $1 
       ORDER BY invitee_created_at DESC 
       LIMIT 1`,
      [`%${user.full_name}%`]
    );

    const booking = bookingResult.rows[0] || {};

    res.json({
      full_name: user.full_name,
      whatsapp_no: booking.invitee_phone?.replace('+91 ', '') || '',
      email: booking.invitee_email || '',
      emergency_contact_name: booking.emergency_contact_name || '',
      emergency_contact_number: booking.emergency_contact_number || ''
    });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateClientProfile(req: Request, res: Response) {
  try {
    const { userId, fullName, whatsappNo, email, emergencyContactName, emergencyContactNumber } = req.body;

    await pool.query(
      'UPDATE users SET full_name = $1 WHERE id = $2',
      [fullName, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
