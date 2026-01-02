import React from 'react';
import { ArrowRight } from 'lucide-react';

export const ClientCheckIns: React.FC = () => {
  const assessments = [
    {
      title: 'Work',
      description: 'Wish to explore your strengths and interests in work? Tap to understand better!',
    },
    {
      title: 'Relationships',
      description: 'Finding it difficult to navigate through some conflicts and bonds?',
    },
    {
      title: 'Career & Self-Development',
      description: 'Personal growth is always an arena that requires you to go above and beyond.',
    },
    {
      title: 'Lifestyle & WellBeing',
      description: 'A lot of our daily habits and behaviours impact our well-being!',
    },
    {
      title: 'Clinical Concerns & Care',
      description: 'Keeping check of our mental health concerns is primary to our daily-functioning.',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Check-Ins</h1>
        <p className="text-gray-600 mb-2">
          Wondering how to find out where you are on your feelings, thoughts, and well-being?
        </p>
        <p className="text-gray-600">
          Answer short and simple questions to find out how your characteristics affect your functioning and well-being and vice-versa. Know your levels of stress, resilience, purpose in life and much more using our scientific tools.
        </p>
      </div>

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-3 gap-6">
        {assessments.map((assessment, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg border p-6 flex flex-col justify-between ${
              index >= 3 ? 'col-span-1' : ''
            }`}
            style={{ minHeight: '200px' }}
          >
            <div>
              <h3 className="text-xl font-bold mb-3">{assessment.title}</h3>
              <p className="text-gray-600 text-sm mb-6">{assessment.description}</p>
            </div>
            <button className="text-teal-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Assess Now <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
