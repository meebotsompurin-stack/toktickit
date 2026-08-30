import React, { useState, useEffect } from 'react';

interface Requester {
  id: string;
  name: string;
}

interface Props {
  onSelect: (requester: Requester) => void;
}

export const DevRequesterSelector: React.FC<Props> = ({ onSelect }) => {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequesters = async () => {
      try {
        // ยิง API ไปที่ GET /api/requesters/active ตามที่ระบุ
        const response = await fetch('/api/requesters/active');
        if (!response.ok) {
          throw new Error('Failed to fetch requesters');
        }
        const data = await response.json();
        setRequesters(data);
      } catch (err: any) {
        console.error('Error fetching requesters:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchRequesters();
  }, []);

  const handleSelect = (requester: Requester) => {
    // 1) บันทึกลง localStorage ตามเงื่อนไข
    localStorage.setItem('toktickit_requester', JSON.stringify(requester));
    // 2) เรียก props onSelect
    onSelect(requester);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-zenPrimary mb-4">Select Requester (Dev Mode)</h3>
      
      {loading && <p className="text-zenPrimary">Loading requesters...</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && requesters.length === 0 && (
        <p className="text-gray-500">No active requesters found.</p>
      )}

      {!loading && !error && requesters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {requesters.map((req) => (
            <button
              key={req.id}
              onClick={() => handleSelect(req)}
              className="bg-zenPrimary hover:bg-zenSecondary text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors text-center truncate"
              title={req.name}
            >
              {req.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
