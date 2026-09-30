import React, { useState, useEffect, useCallback } from 'react';
import { getStaffTickets } from '../api';

interface Ticket {
  id: string;
  ticketNumber: string;
  requestedPriority: string;
  itPriority?: string;
  status: string;
  summary: string;
  createdAt: string;
  appearsResolved: boolean;
  requester?: { name: string; email: string };
  owner?: { name: string; email: string };
  category?: { name: string };
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  onView: (ticketId: string) => void;
}

const STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const StaffQueuePage: React.FC<Props> = ({ onView }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchQueue = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.itPriority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const response = await getStaffTickets(params);
      // Response shape is { data: [...], meta: {...} }
      setTickets(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchQueue(1);
  }, [fetchQueue]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchQueue(newPage);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Staff Ticket Queue</h2>
      </div>

      {/* Filters UI */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Ticket # or Summary" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border-gray-300 rounded focus:ring-zenPrimary focus:border-zenPrimary p-2 border"
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-sm border-gray-300 rounded focus:ring-zenPrimary focus:border-zenPrimary p-2 border bg-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-gray-500 mb-1">IT Priority</label>
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full text-sm border-gray-300 rounded focus:ring-zenPrimary focus:border-zenPrimary p-2 border bg-white"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center mt-6">
          <p className="font-bold text-lg mb-2">Error Loading Queue</p>
          <p>{error}</p>
        </div>
      ) : loading && tickets.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zenPrimary"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-10">
          <p className="mt-4 text-gray-500 font-medium">No tickets match your filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-zenPrimary">
                      {ticket.ticketNumber}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-800">
                      <div className="max-w-xs truncate" title={ticket.summary}>{ticket.summary}</div>
                      <div className="text-xs text-gray-500">{ticket.category?.name || 'Uncategorized'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.requester?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.owner ? (
                        <span className="font-semibold text-gray-700">{ticket.owner.name}</span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.itPriority === 'CRITICAL' || ticket.itPriority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        ticket.itPriority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.itPriority === 'LOW' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.itPriority || 'Not Set'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => onView(ticket.id)}
                        className="text-zenPrimary hover:text-zenSecondary transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Showing page {meta.page} of {meta.totalPages} ({meta.total} total tickets)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => handlePageChange(meta.page + 1)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
