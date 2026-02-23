import React from 'react';

interface EmptyStateCardProps {
  icon: string;
  title: string;
  message: string;
  subMessage?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  message,
  subMessage
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-gray-200">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-2">{message}</p>
      {subMessage && (
        <p className="text-sm text-gray-500 text-center font-medium">{subMessage}</p>
      )}
    </div>
  );
};
