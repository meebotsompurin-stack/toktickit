import React, { useState, useEffect } from 'react';
import { getTickets, getCategories } from '../api';

interface Ticket {
  id: string;
  ticketNumber: string;
  summary: string;
  status: string;
  requestedPriority: string;
}

interface Category {
  id: string;
  name: string;
}

interface Metadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  onView?: (ticketId: string) => void;
}

export const MyTickets: React.FC<Props> = ({ onView }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<Metadata | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for pagination and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search state
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories for filter', err);
      }
    };
    fetchCats();
  }, []);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Filter Changes (reset page)
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setPriority('');
    setStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  useEffect(() => {
    fetchTickets();
  }, [page, debouncedSearch, categoryId, priority, status, sortBy, sortOrder]);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTickets({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        priority: priority || undefined,
        status: status || undefined,
        sortBy,
        sortOrder
      });
      setTickets(response.data);
      setMeta(response.meta);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">My Tickets</h3>
        <button 
          onClick={handleClearFilters}
          className="text-sm px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Control Bar: Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 bg-zenPale p-4 rounded-lg border border-zenPrimary/20">
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Search Ticket # or Summary..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-zenPrimary text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
          <select 
            value={categoryId} 
            onChange={(e) => handleFilterChange(setCategoryId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-zenPrimary text-sm bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
          <select 
            value={priority} 
            onChange={(e) => handleFilterChange(setPriority, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-zenPrimary text-sm bg-white"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select 
            value={status} 
            onChange={(e) => handleFilterChange(setStatus, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-zenPrimary text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Sort By</label>
          <select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder as 'asc' | 'desc');
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-zenPrimary text-sm bg-white"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="ticketNumber-asc">Ticket # (A-Z)</option>
            <option value="ticketNumber-desc">Ticket # (Z-A)</option>
          </select>
        </div>
      </div>
      
      {/* Loading & Error States */}
      {loading && <p className="text-zenPrimary font-medium py-4">Loading tickets...</p>}
      
      {error && <p className="text-red-700 font-semibold mb-4">{error}</p>}
      
      {!loading && !error && tickets.length === 0 && (
        <p className="text-gray-500 bg-gray-50 p-8 rounded text-center border border-dashed border-gray-300">
          No tickets found matching your criteria.
        </p>
      )}

      {/* Ticket List */}
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
                        ${(ticket.requestedPriority === 'High' || ticket.requestedPriority === 'Critical') ? 'bg-red-100 text-red-800' : 
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
                        ${(ticket.requestedPriority === 'High' || ticket.requestedPriority === 'Critical') ? 'bg-red-100 text-red-800' : 
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
                Showing page <span className="font-semibold text-zenPrimary">{meta.page}</span> of <span className="font-semibold text-gray-800">{meta.totalPages}</span> 
                {' '}(Total {meta.total} tickets)
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
