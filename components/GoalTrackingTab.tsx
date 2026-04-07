import React, { useState, useEffect } from 'react';
import { Target, Search, ChevronRight, ChevronDown, Calendar, CheckCircle2, Clock, BarChart3 } from 'lucide-react';

interface GoalTrackingTabProps {
  clientId: string;
  clientName: string;
}

export const GoalTrackingTab: React.FC<GoalTrackingTabProps> = ({ clientId, clientName }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);

  useEffect(() => {
    console.log(`[GoalTrackingTab] Component mounted. clientId: ${clientId}`);
    fetchGoals();
  }, [clientId]);

  const fetchGoals = async () => {
    if (!clientId) {
      console.warn('[GoalTrackingTab] clientId is missing, skipping fetch');
      return;
    }
    
    try {
      console.log(`[GoalTrackingTab] Fetching goals for: ${clientId}`);
      const response = await fetch(`/api/therapy-goals?client_id=${encodeURIComponent(clientId)}`);
      const data = await response.json();
      console.log(`[GoalTrackingTab] API Response:`, data);
      if (data.success) {
        setGoals(data.data);
      }
    } catch (error) {
      console.error('[GoalTrackingTab] Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Initiation': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In-progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Maintenance': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Review': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'Initiation': return 'bg-blue-600';
      case 'In-progress': return 'bg-amber-500';
      case 'Maintenance': return 'bg-emerald-600';
      case 'Review': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  const stages = ['Initiation', 'In-progress', 'Maintenance', 'Review'];
  const getStageIndex = (stage: string) => stages.indexOf(stage);

  const filteredGoals = goals.filter(goal => 
    goal.goal_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.current_stage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Pending';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21615D]"></div>
        <span className="ml-3 text-gray-500">Loading therapy goals...</span>
      </div>
    );
  }

  if (goals.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Target size={40} className="text-gray-300" />
        </div>
        <p className="text-gray-600 text-lg font-medium mb-1">No therapy goals set yet</p>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">Goals established during therapy sessions will appear here to track progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Therapy Goals & Progress</h2>
          <p className="text-sm text-gray-500">Track and manage therapeutic objectives</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#21615D] transition-all"
          />
        </div>
      </div>

      {/* Goals Grid/List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No goals match your search</div>
        ) : (
          filteredGoals.map((goal, index) => {
            const isExpanded = expandedGoalId === goal.id;
            const currentStageIndex = getStageIndex(goal.current_stage);
            const progressPercentage = (Math.max(0, currentStageIndex) / (stages.length - 1)) * 100;

            return (
              <div 
                key={goal.id} 
                className={`group bg-white rounded-xl border transition-all duration-200 ${
                  isExpanded ? 'ring-2 ring-[#21615D] ring-opacity-10 border-[#21615D] shadow-md' : 'hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* Header Section */}
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold text-white ${getStageBadgeColor(goal.current_stage)}`}>
                          {goal.current_stage}
                        </span>
                        <span className="text-xs font-semibold text-gray-400">GOAL #{index + 1}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-[#21615D] transition-colors">
                        {goal.goal_description}
                      </h3>
                      
                      {/* Mini Progress Bar in collapsed view */}
                      {!isExpanded && (
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#21615D] transition-all duration-500" 
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{Math.round(progressPercentage)}%</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-[#21615D] text-white' : 'bg-gray-50 text-gray-400'}`}>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-gray-50 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Progress Timeline Section */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart3 size={16} className="text-[#21615D]" />
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Progress Journey</h4>
                      </div>
                      
                      <div className="relative">
                        {/* Progress Line Background */}
                        <div className="absolute top-[18px] left-8 right-8 h-1 bg-gray-200 rounded-full" />
                        {/* Active Progress Line */}
                        <div 
                          className="absolute top-[18px] left-8 h-1 bg-[#21615D] rounded-full transition-all duration-700"
                          style={{ width: `calc(${progressPercentage}% - 16px)` }}
                        />
                        
                        <div className="relative flex justify-between">
                          {stages.map((stage, idx) => {
                            const isActive = idx <= currentStageIndex;
                            const isCurrent = idx === currentStageIndex;
                            const stageKey = stage.toLowerCase().replace('-', '_') + '_date';
                            const stageDate = goal[stageKey];

                            return (
                              <div key={stage} className="flex flex-col items-center z-10 w-24">
                                <div 
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    isActive 
                                      ? 'bg-[#21615D] border-[#21615D] text-white shadow-lg' 
                                      : 'bg-white border-gray-200 text-gray-300'
                                  } ${isCurrent ? 'ring-4 ring-[#21615D] ring-opacity-20 scale-110' : ''}`}
                                >
                                  {isActive ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                </div>
                                <div className={`text-[11px] font-bold mt-3 text-center ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {stage}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium mt-1">
                                  {formatDate(stageDate)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar size={14} />
                          <span>Started: <span className="font-semibold text-gray-700">{formatDate(goal.initiation_date)}</span></span>
                        </div>
                        <div className="text-gray-300">|</div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock size={14} />
                          <span>Last Activity: <span className="font-semibold text-gray-700">{formatDate(goal.updated_at)}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
