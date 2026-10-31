import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStaffDashboard, apiFetch, type StaffDashboardResponse } from '../api';

interface StaffDashboardProps {
  onNavigate?: (view: string, filter?: any) => void;
  onSelectTicket?: (ticketId: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigate, onSelectTicket }) => {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  const isAdmin = user?.role === 'ADMINISTRATOR';

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff operational metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCount = async () => {
    try {
      const res = await apiFetch('/api/admin/users');
      if (Array.isArray(res)) {
        setTotalUsers(res.length);
      } else if (res?.data && Array.isArray(res.data)) {
        setTotalUsers(res.data.length);
      } else if (typeof res?.total === 'number') {
        setTotalUsers(res.total);
      } else {
        setTotalUsers(0);
      }
    } catch {
      setTotalUsers(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
    if (isAdmin) {
      fetchUserCount();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600 mb-3"></div>
        <p className="text-sm font-medium">Loading operational dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center my-6">
        <p className="font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-sm mb-4">{error || 'Unknown error occurred'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, urgentTickets } = data;
  const totalTickets = Object.values(metrics.byStatus || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isAdmin ? 'Administrator Dashboard' : 'IT Operational Dashboard'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time support ticket health, backlog distribution, and priority queue
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => onNavigate?.('queue')}
            className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Go to Full Queue
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {/* Unassigned Tickets */}
        <div
          onClick={() => onNavigate?.('queue', { unassigned: true })}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-600 transition-all"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Unassigned Tickets
          </span>
          <div className="mt-3">
            <span className="text-4xl font-bold text-slate-800">{metrics.unassigned}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('queue', { unassigned: true });
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              View Queue &rarr;
            </button>
          </div>
        </div>

        {/* Owned by Me */}
        <div
          onClick={() => onNavigate?.('queue', { ownerId: user?.id })}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-600 transition-all"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Owned by Me
          </span>
          <div className="mt-3">
            <span className="text-4xl font-bold text-slate-800">{metrics.ownedByMe}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('queue', { ownerId: user?.id });
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              View My Queue &rarr;
            </button>
          </div>
        </div>

        {/* Recently Updated (7d) */}
        <div
          onClick={() => onNavigate?.('queue', { recentlyUpdated: true })}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-600 transition-all"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recently Updated (7d)
          </span>
          <div className="mt-3">
            <span className="text-4xl font-bold text-slate-800">{metrics.recentlyUpdated}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('queue', { recentlyUpdated: true });
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              View Active &rarr;
            </button>
          </div>
        </div>

        {/* Critical Priority */}
        <div
          onClick={() => onNavigate?.('queue', { priority: 'CRITICAL' })}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-600 transition-all"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Critical Priority
          </span>
          <div className="mt-3">
            <span className="text-4xl font-bold text-slate-800">{metrics.byItPriority['CRITICAL'] || 0}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('queue', { priority: 'CRITICAL' });
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              View Critical &rarr;
            </button>
          </div>
        </div>

        {/* Admin Only: Total User Accounts */}
        {isAdmin && (
          <div
            onClick={() => onNavigate?.('user-management')}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-600 transition-all"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              TOTAL USER ACCOUNTS
            </span>
            <div className="mt-3">
              {totalUsers !== null ? (
                <span className="text-4xl font-bold text-slate-800">{totalUsers}</span>
              ) : (
                <div className="h-10 w-16 bg-slate-200 rounded animate-pulse"></div>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.('user-management');
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                Manage Users &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Tickets by Status</span>
            <span className="text-xs font-normal text-slate-400">Total: {totalTickets}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {Object.entries(metrics.byStatus || {}).map(([status, count]) => (
              <div
                key={status}
                onClick={() => onNavigate?.('queue', { status })}
                className="bg-slate-50 p-2.5 rounded border border-slate-100 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                <span className="block text-xs font-semibold text-slate-500 truncate" title={status}>
                  {status}
                </span>
                <span className="block text-lg font-bold text-slate-800 mt-1">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            Tickets by IT Priority
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
              const count = metrics.byItPriority[priority] || 0;
              const badgeStyle =
                priority === 'CRITICAL'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : priority === 'HIGH'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : priority === 'MEDIUM'
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200';

              return (
                <div
                  key={priority}
                  onClick={() => onNavigate?.('queue', { priority })}
                  className={`p-2.5 rounded border ${badgeStyle} cursor-pointer hover:opacity-80 transition-all`}
                >
                  <span className="block text-xs font-semibold">{priority}</span>
                  <span className="block text-lg font-bold mt-1">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Urgent Tickets Queue */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Urgent Tickets Awaiting Action</h3>
          <span className="text-xs font-medium text-slate-500">{urgentTickets.length} tickets listed</span>
        </div>

        {urgentTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <svg
              className="w-12 h-12 mx-auto text-slate-300 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-semibold text-slate-700">No tickets found</p>
            <p className="text-xs text-slate-400 mt-1">There are no urgent tickets currently awaiting action.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Number</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentTickets.map((t) => {
                  const priority = t.itPriority || null;
                  const priorityStyle =
                    priority === 'CRITICAL'
                      ? 'bg-red-100 text-red-800'
                      : priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800'
                      : priority === 'MEDIUM'
                      ? 'bg-teal-100 text-teal-800'
                      : priority === 'LOW'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-100 text-slate-600 border border-slate-200';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{t.ticketNumber}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate">{t.summary}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${priorityStyle}`}>
                          {priority || 'UNSET'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{t.ownerName}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectTicket?.(t.id)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs rounded transition-colors"
                        >
                          Open Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
