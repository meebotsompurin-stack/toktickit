import React, { useState, useEffect } from 'react';
import { getTicketById, deleteAttachment, uploadAttachmentToTicket, downloadAttachment } from '../api';

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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    
    setDeleteLoading(attachmentId);
    try {
      await deleteAttachment(ticketId, attachmentId);
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

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadAttachmentToTicket(ticketId, uploadFile);
      // Refresh ticket details to show new attachment
      await fetchTicket();
      setUploadFile(null);
      // Reset input type="file" manually by finding it if needed, or rely on state.
      const fileInput = document.getElementById('attachment-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachmentId: string, filename: string) => {
    setDownloadLoading(attachmentId);
    try {
      await downloadAttachment(ticketId, attachmentId, filename);
    } catch (err: any) {
      alert(err.message || 'Failed to download attachment');
    } finally {
      setDownloadLoading(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) return <div className="p-6 text-zenPrimary font-medium">Loading ticket details...</div>;

  if (error === 'Forbidden') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 mt-6 max-w-2xl mx-auto text-center">
        <div className="text-red-500 mb-4 flex justify-center">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h3>
        <p className="text-gray-600 mb-8 font-medium">You do not have permission to view this ticket.</p>
        <button 
          onClick={onBack}
          className="bg-zenPrimary hover:bg-zenSecondary text-white px-6 py-2 rounded shadow-sm transition-colors font-semibold"
        >
          Back to My Tickets
        </button>
      </div>
    );
  }

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
                  <button 
                    onClick={() => handleDownload(file.id, file.filename)}
                    disabled={downloadLoading === file.id}
                    className="px-3 py-1.5 text-xs font-semibold text-zenPrimary bg-zenPale hover:bg-zenPrimary hover:text-white rounded transition-colors disabled:opacity-50"
                  >
                    {downloadLoading === file.id ? 'Downloading...' : 'Download'}
                  </button>
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

        {/* Upload New Attachment Section */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h5 className="text-sm font-bold text-gray-700 mb-3">Add Attachment</h5>
          
          {uploadError && (
            <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {uploadError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <input 
              id="attachment-upload-input"
              type="file" 
              onChange={(e) => {
                setUploadFile(e.target.files?.[0] || null);
                setUploadError(null);
              }}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-zenPale file:text-zenPrimary
                hover:file:bg-zenPrimary hover:file:text-white
                file:transition-colors file:cursor-pointer cursor-pointer border border-gray-200 rounded p-1"
            />
            <button
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
              className="px-4 py-2 bg-zenPrimary text-white text-sm font-semibold rounded shadow-sm hover:bg-zenSecondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
