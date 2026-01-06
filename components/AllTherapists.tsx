import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { TherapistDetailsModal } from './TherapistDetailsModal';
import { Loader } from './Loader';

export const AllTherapists: React.FC = () => {
  const [therapists, setTherapists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/therapists');
      const data = await response.json();
      setTherapists(data);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(therapist => {
    const query = searchQuery.toLowerCase();
    return (
      therapist.name.toLowerCase().includes(query) ||
      therapist.specialization.toLowerCase().includes(query)
    );
  });

  const openTherapistDetails = (therapist: any) => {
    setSelectedTherapist(therapist);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">All Therapists</h1>
          <p className="text-gray-600">View Therapists Details, Specialization and more...</p>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by name or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Therapists Table */}
      {loading ? (
        <Loader />
      ) : (
      <div className="bg-white rounded-lg border flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full h-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapists Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Specialization</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Info</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Total sessions lifetime</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Sessions this month</th>
              </tr>
            </thead>
            <tbody className="h-full">
              {filteredTherapists.length === 0 ? (
                <tr className="h-full">
                  <td colSpan={5} className="text-center text-gray-400 align-middle">
                    No therapists found
                  </td>
                </tr>
              ) : (
                filteredTherapists.map((therapist, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openTherapistDetails(therapist)}
                        className="text-teal-700 hover:underline font-medium text-left"
                      >
                        {therapist.name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {therapist.specialization.split(',').map((spec: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#2D757930', color: '#2D7579' }}>
                            {spec.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{therapist.contact_info || '-'}</td>
                    <td className="px-6 py-4">{therapist.total_sessions_lifetime}</td>
                    <td className="px-6 py-4">{therapist.sessions_this_month}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {filteredTherapists.length} of {therapists.length} results</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">←</button>
            <button className="p-2 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>
      )}
      <TherapistDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        therapist={selectedTherapist}
      />
    </div>
  );
};
