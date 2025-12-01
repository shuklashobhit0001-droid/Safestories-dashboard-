import React from 'react';

export const HeroPanel: React.FC = () => {
  return (
    <div className="w-full h-full rounded-[40px] bg-teal-700 relative overflow-hidden flex items-center justify-center text-center p-8 md:p-12 lg:p-20 shadow-2xl">
      {/* Background Gradient Effect - subtle radial glow to match image depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#266E6E_0%,_#1a4d4a_100%)]"></div>
      
      {/* Texture overlay (optional, keeping it clean based on image) */}
      
      <div className="relative z-10 text-white max-w-lg mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Therapy is for <br/> Everyone
        </h2>
        <p className="text-white/90 text-sm md:text-base leading-relaxed font-normal">
          Seeking support and asking for help require courage and we will guide you through the process, at all times!
        </p>
      </div>
    </div>
  );
};