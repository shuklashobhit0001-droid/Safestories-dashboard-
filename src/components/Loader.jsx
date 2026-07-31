import React from 'react';
import './Loader.css';

export const Loader = () => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div className="loader-wrapper">
        <div className="logo">
          {/* Fallback Safestories Logo text to replace the missing Logo component */}
          <h1 style={{ color: '#21615D', fontFamily: 'sans-serif', margin: 0, fontSize: '32px' }}>SafeStories</h1>
        </div>
        <div className="progress">
          <div className="fill" />
        </div>
      </div>
    </div>
  );
};
