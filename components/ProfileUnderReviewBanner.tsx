import React from 'react';
import { Clock } from 'lucide-react';

export const ProfileUnderReviewBanner: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📋</div>
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800 mb-1">
            Profile Under Review
          </h4>
          <p className="text-sm text-yellow-700 mb-2">
            Your profile is currently being reviewed by our team. 
            This usually takes 5-10 days. You'll receive an email 
            once your profile is approved!
          </p>
          <div className="flex items-center gap-2 text-xs text-yellow-600">
            <Clock size={14} />
            <span>In the meantime, you can view your profile and explore the dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
