import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2 } from 'lucide-react';

interface GoalTrackingTabProps {
  clientId: string;
  clientName: string;
}

export const GoalTrackingTab: React.FC<GoalTrackingTabProps> = ({ clientId, clientName }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, [clientId]);

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/therapy-goals?client_id=${clientId}`);
      const data = await response.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Initiation': return 'bg-blue-100 text-blue-700';
      case 'In-progress': return 'bg-yellow-100 text-yellow-700';
      case 'Maintenance': return 'bg-green-100 text-green-700';
      case 'Review': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Initiation': return '🔵';
      case 'In-progress': return '🟡';
      case 'Maintenance': return '🟢';
      case 'Review': return '🟣';
      default: return '⚪';
    }
  };

  const stages = ['Initiation', 'In-progress', 'Maintenance', 'Review'];

  const getStageIndex = (stage: string) => stages.indexOf(stage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading therapy goals...</div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <Target size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-4">No therapy goals set yet</p>
        <p className="text-gray-400 text-sm mb-6">Goals will be established during therapy sessions</p>
        <button className="flex items-center gap-2 mx-auto px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800">
          <Plus size={18} />
          <span>Add First Goal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Therapy Goals & Progress</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800">
          <Plus size={18} />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal, index) => {
          const currentStageIndex = getStageIndex(goal.current_stage);
          
          return (
            <div key={goal.id} className="bg-white rounded-lg border p-6">
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">Goal #{index + 1}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(goal.current_stage)}`}>
                      {getStageIcon(goal.current_stage)} {goal.current_stage}
                    </span>
                  </div>
                  <p className="text-gray-700">{goal.goal_description}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Progress Timeline */}
              <div className="mt-6">
                <div className="text-xs font-medium text-gray-500 mb-3">Progress Timeline:</div>
                <div className="relative">
                  {/* Progress Bar */}
                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Stage Markers */}
                  <div className="relative flex justify-between">
                    {stages.map((stage, idx) => {
                      const isCompleted = idx <= currentStageIndex;
                      const stageDate = goal[`${stage.toLowerCase().replace('-', '_')}_date`];
                      
                      return (
                        <div key={stage} className="flex flex-col items-center" style={{ width: '25%' }}>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted
                                ? 'bg-teal-600 border-teal-600 text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <div className="text-xs font-medium text-gray-700 mt-2 text-center">
                            {stage}
                          </div>
                          {stageDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(stageDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                Last updated: {new Date(goal.updated_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
