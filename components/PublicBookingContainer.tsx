import React, { useEffect, useState } from 'react';
import { BookingPage } from './BookingPage';
import { therapistData } from '../lib/sessionData';
import { Loader } from 'lucide-react';

interface PublicBookingContainerProps {
  slug: string;
}

export const PublicBookingContainer: React.FC<PublicBookingContainerProps> = ({ slug }) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this might be an API call: GET /api/public/events/:slug
    // For now, we search the local robust therapistData for the slug match.
    let foundSession = null;
    let fallbackOwner = "";

    for (const [therapistName, data] of Object.entries(therapistData)) {
      const match = data.services.find(s => s.slug === `/${slug}`);
      if (match) {
        foundSession = { ...match, owner: therapistName };
        break;
      }
    }

    if (foundSession) {
      setSessionData(foundSession);
    } else {
      setError("Session not found or is no longer available.");
    }
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin text-teal-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BookingPage session={sessionData} isPublic={true} />
    </div>
  );
};
