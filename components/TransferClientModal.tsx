import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface TransferClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    invitee_name: string;
    invitee_email: string;
    invitee_phone: string;
    booking_host_name: string;
  } | null;
  onTransferSuccess: () => void;
  adminUser: any;
}

export const TransferClientModal: React.FC<TransferClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onTransferSuccess,
  adminUser
}) => {
  const [therapists, setTherapists] = useState<any[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTherapists();
    }
  }, [isOpen]);

  const fetchTherapists = async () => {
    try {
      const response = await fetch('/api/therapists');
      const data = await response.json();
      setTherapists(data);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    }
  };

  const handleTransfer = async () => {
    console.log('handleTransfer called');
    console.log('client:', client);
    console.log('selectedTherapist:', selectedTherapist);
    console.log('confirmText:', confirmText);
    
    if (!client || !selectedTherapist || confirmText !== 'TRANSFER') return;

    console.log('Validation passed, making API call');
    setLoading(true);
    try {
      const response = await fetch('/api/transfer-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.invitee_name,
          clientEmail: client.invitee_email,
          clientPhone: client.invitee_phone,
          fromTherapistName: client.booking_host_name,
          toTherapistId: selectedTherapist,
          transferredByAdminId: adminUser.id,
          transferredByAdminName: adminUser.full_name || adminUser.username,
          reason
        })
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onTransferSuccess();
          handleClose();
        }, 2000);
      } else {
        alert('Transfer failed. Please try again.');
      }
    } catch (error) {
      console.error('Error transferring client:', error);
      alert('Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTherapist('');
    setConfirmText('');
    setReason('');
    onClose();
  };

  if (!isOpen || !client) return null;

  const selectedTherapistData = therapists.find(t => t.therapist_id === selectedTherapist);

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Transfer Successful!</h3>
          <p className="text-gray-600">Client has been transferred successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-orange-600 flex items-center gap-2">
            <AlertTriangle size={24} />
            Transfer Client
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="text-sm mb-2"><strong>Client:</strong> {client.invitee_name}</p>
          <p className="text-sm mb-2"><strong>Email:</strong> {client.invitee_email}</p>
          <p className="text-sm mb-2"><strong>Phone:</strong> {client.invitee_phone}</p>
          <p className="text-sm"><strong>Current Therapist:</strong> {client.booking_host_name}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select New Therapist *
          </label>
          <select
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- Select Therapist --</option>
            {therapists
              .filter(t => t.name !== client.booking_host_name)
              .map(t => (
                <option key={t.therapist_id} value={t.therapist_id}>
                  {t.name} - {t.specialization}
                </option>
              ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Transfer (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows={3}
            placeholder="Enter reason for transfer..."
          />
        </div>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Historical sessions will remain with the current therapist. 
            Future sessions will be assigned to the new therapist.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type "TRANSFER" to confirm *
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Type TRANSFER"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedTherapist || confirmText !== 'TRANSFER' || loading}
            className={`flex-1 px-4 py-2 rounded-lg ${
              selectedTherapist && confirmText === 'TRANSFER' && !loading
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Transferring...' : 'Transfer Client'}
          </button>
        </div>
      </div>
    </div>
  );
};
