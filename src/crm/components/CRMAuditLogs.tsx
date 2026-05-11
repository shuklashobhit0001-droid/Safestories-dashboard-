import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface CRMAuditLog {
  log_id: number;
  user_name: string;
  action_type: string;
  action_description: string;
  lead_name: string | null;
  timestamp: string;
}

export const CRMAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<CRMAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/crm-audit-logs');
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching CRM logs:', error);
      setLogs([]);
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(query) ||
      log.action_type?.toLowerCase().includes(query) ||
      log.action_description?.toLowerCase().includes(query) ||
      log.lead_name?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Invalid Date';
    
    if (timestamp.includes('IST')) {
      return timestamp;
    }
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('create')) return 'text-green-600';
    if (actionType.includes('update')) return 'text-blue-600';
    if (actionType.includes('delete')) return 'text-red-600';
    if (actionType.includes('stage_change')) return 'text-orange-600';
    if (actionType.includes('assign')) return 'text-purple-600';
    return 'text-gray-600';
  };

  const formatActionType = (actionType: string) => {
    const actionMap: { [key: string]: string } = {
      'lead_create': 'Lead Created',
      'lead_update': 'Lead Updated',
      'lead_delete': 'Lead Deleted',
      'lead_stage_change': 'Stage Changed',
      'lead_assign': 'Lead Assigned',
      'pretherapy_form_submit': 'Pre-therapy Form Submitted',
      'remark_add': 'Remark Added',
      'profile_update': 'Profile Updated'
    };
    
    return actionMap[actionType] || actionType.replace(/_/g, ' ');
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">CRM Audit Logs</h1>
          <p className="text-gray-600">Track all CRM activities</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by user, action, or lead..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border flex-1 flex items-center justify-center relative">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            <p className="text-gray-500">Loading audit logs...</p>
          </div>
        </div>
      ) : (
      <div className="bg-white rounded-lg border flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">User</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Lead</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    No logs found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.log_id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-6 py-4 text-sm">{log.user_name}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${getActionColor(log.action_type)}`}>
                      {formatActionType(log.action_type)}
                    </td>
                    <td className="px-6 py-4 text-sm">{log.action_description}</td>
                    <td className="px-6 py-4 text-sm">{log.lead_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
