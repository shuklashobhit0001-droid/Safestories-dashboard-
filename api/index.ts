import { VercelRequest, VercelResponse } from '@vercel/node';
import login from './login';
import therapists from './therapists';
import clients from './clients';
import appointments from './appointments';
import therapies from './therapies';
import refunds from './refunds';
import bookingRequests from './booking-requests';
import therapistAppointments from './therapist-appointments';
import therapistClients from './therapist-clients';
import therapistDetails from './therapist-details';
import therapistStats from './therapist-stats';
import dashboardBookings from './dashboard/bookings';
import dashboardStats from './dashboard/stats';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { route } = req.query;
  
  if (!route || typeof route !== 'string') {
    return res.status(400).json({ error: 'Route parameter required' });
  }

  const handlers: Record<string, any> = {
    'login': login,
    'therapists': therapists,
    'clients': clients,
    'appointments': appointments,
    'therapies': therapies,
    'refunds': refunds,
    'booking-requests': bookingRequests,
    'therapist-appointments': therapistAppointments,
    'therapist-clients': therapistClients,
    'therapist-details': therapistDetails,
    'therapist-stats': therapistStats,
    'dashboard/bookings': dashboardBookings,
    'dashboard/stats': dashboardStats,
  };

  const handler = handlers[route];
  if (!handler) {
    return res.status(404).json({ error: 'Route not found' });
  }

  return handler(req, res);
}
