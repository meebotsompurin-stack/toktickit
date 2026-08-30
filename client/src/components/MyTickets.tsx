import React, { useState, useEffect } from 'react';
import { getTickets } from '../api';

interface Ticket {
  id: string;
  ticketNumber: string;
  summary: string;
  status: string;
  requestedPriority: string;
}

interface Metadata {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface Props {
  onView?: (ticketId: string) => void;
}

export const MyTickets: React.FC<Props> = ({ onView }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTickets(page);
  }, [page]);

  const fetchTickets = async (pageToFetch: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTickets(pageToFetch, 10);
      setTickets(response.data);
      setMeta({
        currentPage: response.currentPage,
        itemsPerPage: response.itemsPerPage,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (meta && page < meta.totalPages) setPage(page + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">My Tickets</h3>
      
      {loading && <p className="text-zenPrimary font-medium">Loading tickets...</p>}
      
      {error && <p className="text-red-700 font-semibold mb-4">{error}</p>}
      
      {!loading && !error && tickets.length === 0 && (
        <p className="text-gray-500 bg-zenPale p-4 rounded text-center">No tickets found.</p>
      )}

      {!loading && !error && tickets.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zenBg text-gray-700 border-b-2 border-zenPrimary">
                  <th className="py-3 px-4 font-semibold">Ticket #</th>
                  <th className="py-3 px-4 font-semibold">Summary</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b hover:bg-zenPale transition-colors">
                    <td className="py-3 px-4 text-zenSecondary font-medium">
                      {onView ? (
                        <button onClick={() => onView(ticket.id)} className="hover:underline hover:text-zenPrimary">
                          {ticket.ticketNumber}
                        </button>
                      ) : (
                        ticket.ticketNumber
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-800">
                      <div className="truncate max-w-xs" title={ticket.summary}>
                        {ticket.summary}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-zenBg text-gray-700 px-2 py-1 rounded-full text-sm border border-gray-300">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-sm font-semibold
                        ${ticket.requestedPriority === 'High' ? 'bg-red-100 text-red-800' : 
                          ticket.requestedPriority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {ticket.requestedPriority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => onView && onView(ticket.id)}
                        className="text-zenPrimary hover:text-white border border-zenPrimary hover:bg-zenPrimary px-3 py-1 rounded transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  {onView ? (
                    <button onClick={() => onView(ticket.id)} className="text-zenSecondary font-bold hover:underline">
                      {ticket.ticketNumber}
                    </button>
                  ) : (
                    <span className="text-zenSecondary font-bold">{ticket.ticketNumber}</span>
                  )}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                        ${ticket.requestedPriority === 'High' ? 'bg-red-100 text-red-800' : 
                          ticket.requestedPriority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                    {ticket.requestedPriority}
                  </span>
                </div>
                <p className="text-gray-800 font-medium mb-3 line-clamp-2" title={ticket.summary}>
                  {ticket.summary}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="inline-block bg-zenBg text-gray-700 px-2 py-1 rounded-full border border-gray-300">
                    Status: {ticket.status}
                  </span>
                  <button 
                    onClick={() => onView && onView(ticket.id)}
                    className="text-zenPrimary font-semibold hover:underline"
                  >
                    View Detail
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 mb-4 sm:mb-0">
                Showing page <span className="font-semibold text-zenPrimary">{meta.currentPage}</span> of <span className="font-semibold text-gray-800">{meta.totalPages}</span> 
                {' '}(Total {meta.totalItems} tickets)
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={handlePrev} 
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-md text-gray-600 bg-white hover:bg-zenPale hover:text-zenPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-zenPrimary focus:outline-none"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button 
                  onClick={handleNext} 
                  disabled={page === meta.totalPages || meta.totalPages === 0}
                  className="px-4 py-2 border rounded-md text-white bg-zenPrimary hover:bg-zenSecondary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-zenPrimary focus:outline-none"
                  aria-label="Next page"
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
