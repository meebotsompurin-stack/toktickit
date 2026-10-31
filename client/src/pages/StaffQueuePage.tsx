import React, { useState, useEffect, useCallback } from 'react';
import { getStaffTickets, getStaffMembers } from '../api';

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
  owner?: { id?: string; name: string; email: string };
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
  initialFilter?: any;
  initialFilters?: any;
}

const STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const StaffQueuePage: React.FC<Props> = ({ onView, initialFilter, initialFilters }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff members for the Owner dropdown
  const [staffMembers, setStaffMembers] = useState<{ id: string; name: string; email?: string }[]>([]);

  // Helper to extract initial values from props or location
  const getInitialValues = useCallback(() => {
    const raw = initialFilters || initialFilter || {};
    const searchParams = typeof window !== 'undefined' && window.location?.search ? new URLSearchParams(window.location.search) : null;

    let initOwner = '';
    if (raw.unassigned || raw.ownerId === 'unassigned' || raw.owner === 'unassigned') {
      initOwner = 'unassigned';
    } else if (raw.ownerId) {
      initOwner = String(raw.ownerId);
    } else if (raw.owner) {
      initOwner = String(raw.owner);
    } else if (searchParams) {
      if (searchParams.get('unassigned') === 'true' || searchParams.get('ownerId') === 'unassigned' || searchParams.get('owner') === 'unassigned') {
        initOwner = 'unassigned';
      } else if (searchParams.get('ownerId')) {
        initOwner = searchParams.get('ownerId')!;
      } else if (searchParams.get('owner')) {
        initOwner = searchParams.get('owner')!;
      }
    }

    let initPriority = '';
    if (raw.priority) {
      initPriority = String(raw.priority);
    } else if (raw.itPriority) {
      initPriority = String(raw.itPriority);
    } else if (searchParams) {
      initPriority = searchParams.get('itPriority') || searchParams.get('priority') || '';
    }

    let initStatus = '';
    if (raw.status) {
      initStatus = String(raw.status);
    } else if (searchParams && searchParams.get('status')) {
      initStatus = searchParams.get('status')!;
    }

    let initRecentlyUpdated = false;
    if (raw.recentlyUpdated !== undefined) {
      initRecentlyUpdated = Boolean(raw.recentlyUpdated);
    } else if (searchParams && searchParams.get('recentlyUpdated') === 'true') {
      initRecentlyUpdated = true;
    }

    let initSearch = '';
    if (raw.search) {
      initSearch = String(raw.search);
    } else if (searchParams && searchParams.get('search')) {
      initSearch = searchParams.get('search')!;
    }

    return { initOwner, initPriority, initStatus, initRecentlyUpdated, initSearch };
  }, [initialFilters, initialFilter]);

  const initialVals = getInitialValues();

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>(initialVals.initStatus);
  const [priorityFilter, setPriorityFilter] = useState<string>(initialVals.initPriority);
  const [ownerFilter, setOwnerFilter] = useState<string>(initialVals.initOwner);
  const [recentlyUpdated, setRecentlyUpdated] = useState<boolean>(initialVals.initRecentlyUpdated);
  const [search, setSearch] = useState<string>(initialVals.initSearch);

  // Sync state if props change (e.g. user navigates from Dashboard multiple times)
  useEffect(() => {
    const vals = getInitialValues();
    setStatusFilter(vals.initStatus);
    setPriorityFilter(vals.initPriority);
    setOwnerFilter(vals.initOwner);
    setRecentlyUpdated(vals.initRecentlyUpdated);
    setSearch(vals.initSearch);
  }, [getInitialValues]);

  // Load staff members on mount
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const members = await getStaffMembers();
        if (Array.isArray(members)) {
          setStaffMembers(members);
        }
      } catch (e) {
        console.error('Failed to load staff members:', e);
      }
    };
    loadStaff();
  }, []);

  const fetchQueue = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.itPriority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      if (ownerFilter === 'unassigned') {
        params.unassigned = 'true';
      } else if (ownerFilter) {
        params.ownerId = ownerFilter;
      }

      if (recentlyUpdated) {
        params.recentlyUpdated = 'true';
      }

      const response = await getStaffTickets(params);
      setTickets(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, ownerFilter, recentlyUpdated, search]);

  useEffect(() => {
    fetchQueue(1);
  }, [fetchQueue]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchQueue(newPage);
    }
  };

  const hasActiveFilters = Boolean(statusFilter || priorityFilter || ownerFilter || recentlyUpdated || search);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Staff Ticket Queue</h2>
        {hasActiveFilters && (
          <span className="text-xs text-slate-500 font-medium mt-1 md:mt-0">
            Showing filtered results ({meta.total} total)
          </span>
        )}
      </div>

      {/* Active Filter Indicator for Recently Updated */}
      {recentlyUpdated && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Filtered by: Recently Updated (Last 7 Days)
            <button
              onClick={() => setRecentlyUpdated(false)}
              className="hover:text-emerald-950 font-bold ml-1 text-sm"
              title="Remove filter"
            >
              &times;
            </button>
          </span>
        </div>
      )}

      {/* Filters UI */}
      <div className="flex flex-col md:flex-row flex-wrap items-end gap-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Ticket # or Summary" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border-gray-300 rounded focus:ring-zenPrimary focus:border-zenPrimary p-2 border"
          />
        </div>

        <div className="w-full md:w-44">
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

        <div className="w-full md:w-44">
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

        {/* Owner Filter */}
        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Owner</label>
          <select 
            value={ownerFilter} 
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full text-sm border-gray-300 rounded focus:ring-zenPrimary focus:border-zenPrimary p-2 border bg-white"
          >
            <option value="">All Owners</option>
            <option value="unassigned">Unassigned</option>
            {staffMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
            {!staffMembers.some(m => m.id === ownerFilter) && ownerFilter && ownerFilter !== 'unassigned' && (
              <option value={ownerFilter}>Selected Owner</option>
            )}
          </select>
        </div>

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <div className="w-full md:w-auto">
            <button
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
                setOwnerFilter('');
                setRecentlyUpdated(false);
                setSearch('');
              }}
              className="text-xs px-3 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
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
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-zenPrimary">
                      {ticket.ticketNumber}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-800">
                      <div className="max-w-xs truncate font-medium" title={ticket.summary}>{ticket.summary}</div>
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
                      <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                        ticket.itPriority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        ticket.itPriority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        ticket.itPriority === 'MEDIUM' ? 'bg-teal-100 text-teal-800' :
                        ticket.itPriority === 'LOW' ? 'bg-slate-100 text-slate-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {ticket.itPriority || 'Not Set'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => onView(ticket.id)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition-colors"
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
