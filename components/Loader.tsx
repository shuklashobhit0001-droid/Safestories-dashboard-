import React from 'react';
import './Loader.css';
import { Logo } from './Logo';

export const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-50">
      <div className="loader-wrapper">
        <div className="logo">
          <Logo size="medium" />
        </div>
        <div className="progress">
          <div className="fill" />
        </div>
      </div>
    </div>
  );
};
