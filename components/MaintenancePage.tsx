import React from 'react';
import { Wrench } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center">
            <Wrench size={48} className="text-teal-700" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Under Maintenance</h1>
        <p className="text-gray-600 text-lg mb-2">We're currently performing scheduled maintenance.</p>
        <p className="text-gray-600">We'll be back shortly. Thank you for your patience!</p>
      </div>
    </div>
  );
};
