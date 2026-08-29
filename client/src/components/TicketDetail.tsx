import React, { useState, useEffect } from 'react';
import { getTicketById, deleteAttachment } from '../api';

interface Attachment {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  requestedPriority: string;
  status: string;
  summary: string;
  description: string;
  createdAt: string;
  category?: { name: string };
  relatedSystem?: { name: string };
  attachments?: Attachment[];
}

interface Props {
  ticketId: string;
  onBack: () => void;
}

export const TicketDetail: React.FC<Props> = ({ ticketId, onBack }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTicketById(ticketId);
        setTicket(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch ticket details');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    
    setDeleteLoading(attachmentId);
    try {
      await deleteAttachment(ticketId, attachmentId);
      // อัปเดต state ลบไฟล์นั้นออกจากหน้าจอ
      if (ticket) {
        setTicket({
          ...ticket,
          attachments: ticket.attachments?.filter(a => a.id !== attachmentId) || []
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete attachment');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) return <div className="p-6 text-zenPrimary font-medium">Loading ticket details...</div>;

  if (error || !ticket) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 max-w-2xl mx-auto text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Error</h3>
        <p className="text-red-600 mb-6 font-medium">{error || 'Ticket not found'}</p>
        <button 
          onClick={onBack}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded shadow-sm transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 max-w-3xl mx-auto text-left relative">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-zenPrimary transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to My Tickets
      </button>

      <div className="flex justify-between items-end mb-6 border-b pb-4 border-zenPrimary">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{ticket.ticketNumber}</h2>
          <p className="text-sm text-gray-500 mt-1">Created on {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Status</p>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {ticket.status}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Priority</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            ticket.requestedPriority === 'High' || ticket.requestedPriority === 'Critical' ? 'bg-red-100 text-red-800' :
            ticket.requestedPriority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {ticket.requestedPriority}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Category</p>
          <p className="text-gray-800">{ticket.category?.name || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Related System</p>
          <p className="text-gray-800">{ticket.relatedSystem?.name || '-'}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 font-semibold mb-1">Summary</p>
        <p className="text-gray-800 font-medium text-lg">{ticket.summary}</p>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-500 font-semibold mb-2">Description</p>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap">
          {ticket.description}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Attachments</h4>
        
        {(!ticket.attachments || ticket.attachments.length === 0) ? (
          <p className="text-gray-500 italic">No attachments</p>
        ) : (
          <ul className="space-y-3">
            {ticket.attachments.map((file) => (
              <li key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center truncate mr-4">
                  <div className="bg-zenPale text-zenPrimary p-2 rounded mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-800 truncate" title={file.filename}>{file.filename}</p>
                    <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex space-x-2 shrink-0">
                  <a 
                    href={`http://localhost:3000/uploads/${file.filename}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-zenPrimary bg-zenPale hover:bg-zenPrimary hover:text-white rounded transition-colors"
                  >
                    Download
                  </a>
                  <button 
                    onClick={() => handleDeleteAttachment(file.id)}
                    disabled={deleteLoading === file.id}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded transition-colors disabled:opacity-50"
                  >
                    {deleteLoading === file.id ? '...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
