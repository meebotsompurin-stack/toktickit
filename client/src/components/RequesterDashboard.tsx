import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRequesterDashboard, type RequesterDashboardResponse } from '../api';

interface RequesterDashboardProps {
  onNavigate?: (view: string, filter?: any) => void;
  onSelectTicket?: (ticketId: string) => void;
  onCreateTicket?: () => void;
}

export const RequesterDashboard: React.FC<RequesterDashboardProps> = ({
  onNavigate,
  onSelectTicket,
  onCreateTicket,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRequesterDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load support ticket summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600 mb-3"></div>
        <p className="text-sm font-medium">Loading your support dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center my-6">
        <p className="font-semibold mb-2">Unable to Load Dashboard</p>
        <p className="text-sm mb-4">{error || 'Unknown error occurred'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, recentTickets } = data;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Here is a summary of your recent support requests and pending activities.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => {
              if (onCreateTicket) onCreateTicket();
              else if (onNavigate) onNavigate('create');
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Create Support Ticket</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Open Tickets */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Open Tickets</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold">Active</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-slate-800">{metrics.totalOpen}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={() => onNavigate?.('tickets', { status: 'open' })}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              View Open Tickets &rarr;
            </button>
          </div>
        </div>

        {/* Needs Your Attention */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Needs Your Attention</span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-md text-xs font-bold">Action Needed</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-amber-700">{metrics.waitingForRequester}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={() => onNavigate?.('tickets', { status: 'WAITING_FOR_REQUESTER' })}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              Respond Now &rarr;
            </button>
          </div>
        </div>

        {/* Recently Updated */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recently Updated (7d)</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">Updated</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-slate-800">{metrics.recentlyUpdated}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={() => onNavigate?.('tickets', { recentlyUpdated: true })}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View Recent Updates &rarr;
            </button>
          </div>
        </div>

        {/* Recently Resolved */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-teal-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recently Resolved</span>
            <span className="p-2 bg-teal-50 text-teal-600 rounded-md text-xs font-bold">Resolved</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-slate-800">{metrics.recentlyResolved}</span>
          </div>
          <div className="mt-4">
            <button
              onClick={() => onNavigate?.('tickets', { status: 'RESOLVED' })}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              View Resolved &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Support Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">My Recent Support Tickets</h3>
          <button
            onClick={() => onNavigate?.('tickets')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            View All My Tickets &rarr;
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <svg
              className="w-14 h-14 mx-auto text-slate-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="font-semibold text-base text-slate-700">You have no active support tickets.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Need technical assistance? Submit a request today.
            </p>
            <button
              onClick={() => {
                if (onCreateTicket) onCreateTicket();
                else if (onNavigate) onNavigate('create');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              + Create Support Ticket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Number</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{t.ticketNumber}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium max-w-sm truncate">{t.summary}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.status === 'WAITING_FOR_REQUESTER'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-800'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                      {t.requestedPriority || 'MEDIUM'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectTicket?.(t.id)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs rounded transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
