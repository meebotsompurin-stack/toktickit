import React, { useState, useEffect } from 'react';
import { getCategories, getRelatedSystems, createTicket, uploadAttachment } from '../api';

interface Category {
  id: string;
  name: string;
}

interface RelatedSystem {
  id: string;
  name: string;
}

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateTicket: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  
  const [categoryId, setCategoryId] = useState('');
  const [relatedSystemId, setRelatedSystemId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catData, sysData] = await Promise.all([
          getCategories(),
          getRelatedSystems(),
        ]);
        setCategories(catData);
        setSystems(sysData);
      } catch (err: any) {
        setError(err.message || 'Failed to load options');
      } finally {
        setInitLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !relatedSystemId || !summary.trim() || !description.trim()) {
      setError('Please fill in all required fields (including Description).');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const ticketPayload = {
        categoryId,
        relatedSystemId,
        requestedPriority: priority,
        summary: summary.trim(),
        description: description.trim(),
      };
      
      const newTicket = await createTicket(ticketPayload);
      
      if (file && newTicket && newTicket.id) {
        await uploadAttachment(newTicket.id, file);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <div className="p-6 text-zenPrimary font-medium">Loading form...</div>;

  // ถ้าโหลด Categories หรือ Systems ไม่ผ่าน ไม่ควรพยายามเรนเดอร์ฟอร์ม
  if (error && (categories.length === 0 || systems.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 max-w-2xl mx-auto text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Error Loading Form</h3>
        <p className="text-red-600 mb-6 font-medium">{error}</p>
        <button 
          onClick={onCancel}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded shadow-sm transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 max-w-2xl mx-auto text-left">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 border-zenPrimary">Create New Ticket</h3>
      
      {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
          <select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-zenPrimary focus:outline-none"
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Related System <span className="text-red-500">*</span></label>
          <select 
            value={relatedSystemId} 
            onChange={(e) => setRelatedSystemId(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-zenPrimary focus:outline-none"
            required
          >
            <option value="">-- Select System --</option>
            {systems.map(sys => (
              <option key={sys.id} value={sys.id}>{sys.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-zenPrimary focus:outline-none"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Summary <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            maxLength={100}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-zenPrimary focus:outline-none"
            placeholder="Brief summary of the issue (Max 100 chars)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <textarea 
            maxLength={1000}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-zenPrimary focus:outline-none"
            placeholder="Detailed description..."
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Attachment</label>
          <input 
            type="file" 
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded p-2 focus:outline-none text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zenPale file:text-zenPrimary hover:file:bg-zenPrimary hover:file:text-white"
          />
          <p className="text-xs text-gray-500 mt-1">Accepted formats: Images or PDF. Max 5MB.</p>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-zenPrimary hover:bg-zenSecondary text-white px-6 py-2 rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded shadow-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
