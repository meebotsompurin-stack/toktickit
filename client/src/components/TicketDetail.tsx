import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTicketById, deleteAttachment, uploadAttachmentToTicket, downloadAttachment, 
  addPublicComment, getTicketComments, toggleAppearsResolved,
  getTicketNotes, addTicketNote,
  updateStaffTicketOwner, updateStaffTicketPriority, updateStaffTicketStatus
} from '../api';

interface Attachment {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: { name: string; role: string };
}

interface Ticket {
  id: string;
  ticketNumber: string;
  requesterId: string;
  ownerId?: string | null;
  owner?: { name: string; email: string } | null;
  requestedPriority: string;
  itPriority?: string | null;
  status: string;
  summary: string;
  description: string;
  createdAt: string;
  appearsResolved: boolean;
  category?: { name: string };
  relatedSystem?: { name: string };
  attachments?: Attachment[];
}

interface Props {
  ticketId: string;
  onBack: () => void;
}

const TICKET_STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const TicketDetail: React.FC<Props> = ({ ticketId, onBack }) => {
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  
  const [notes, setNotes] = useState<Comment[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [isTogglingResolved, setIsTogglingResolved] = useState(false);
  const [isUpdatingIT, setIsUpdatingIT] = useState(false);

  // Tab State: 'public' | 'internal'
  const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');

  const fetchTicket = async () => {
    try {
      const data = await getTicketById(ticketId);
      setTicket(data);
      const commentsData = await getTicketComments(ticketId);
      setComments(commentsData);
      
      if (isStaffOrAdmin) {
        const notesData = await getTicketNotes(ticketId);
        setNotes(notesData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const handleToggleResolved = async () => {
    if (!ticket) return;
    setIsTogglingResolved(true);
    try {
      const updatedTicket = await toggleAppearsResolved(ticket.id, !ticket.appearsResolved);
      setTicket({ ...ticket, appearsResolved: updatedTicket.appearsResolved });
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    } finally {
      setIsTogglingResolved(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!ticket) return;
    setIsUpdatingIT(true);
    try {
      const updatedTicket = await updateStaffTicketStatus(ticketId, status);
      setTicket(updatedTicket);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingIT(false);
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    if (!ticket) return;
    setIsUpdatingIT(true);
    try {
      const updatedTicket = await updateStaffTicketPriority(ticketId, priority);
      setTicket(updatedTicket);
    } catch (err: any) {
      alert(err.message || 'Failed to update priority');
    } finally {
      setIsUpdatingIT(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !ticket) return;
    setIsUpdatingIT(true);
    try {
      const updatedTicket = await updateStaffTicketOwner(ticketId);
      setTicket(updatedTicket);
    } catch (err: any) {
      alert(err.message || 'Failed to claim ticket');
    } finally {
      setIsUpdatingIT(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setCommentError('Comment content cannot be empty');
      return;
    }
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const created = await addPublicComment(ticketId, newComment);
      setComments([...comments, created]);
      setNewComment('');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setNoteError('Note content cannot be empty');
      return;
    }
    setIsSubmittingNote(true);
    setNoteError(null);
    try {
      const created = await addTicketNote(ticketId, newNote);
      setNotes([...notes, created]);
      setNewNote('');
    } catch (err: any) {
      setNoteError(err.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

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
      await fetchTicket();
      setUploadFile(null);
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
      const blob = await downloadAttachment(ticketId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zenPrimary"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center mt-6">
        <p className="font-bold text-lg mb-2">Error</p>
        <p>{error || 'Ticket not found'}</p>
        <button 
          onClick={onBack}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded shadow-sm transition-colors mt-4"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 max-w-4xl mx-auto text-left relative">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-zenPrimary transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to List
      </button>

      <div className="flex justify-between items-start mb-6 border-b pb-4 border-zenPrimary">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{ticket.ticketNumber}</h2>
          <p className="text-sm text-gray-500 mt-1">Created on {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={handleToggleResolved}
            disabled={isTogglingResolved}
            className={`px-4 py-2 text-sm font-semibold rounded shadow-sm transition-colors ${
              ticket.appearsResolved ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {ticket.appearsResolved ? '✅ Appears Resolved' : 'Mark as Resolved'}
          </button>
          
          {isStaffOrAdmin && !ticket.ownerId && (
            <button
              onClick={handleClaim}
              disabled={isUpdatingIT}
              className="px-4 py-2 text-sm font-semibold rounded shadow-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Claim Ticket
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Status</p>
          {isStaffOrAdmin ? (
            <select
              value={ticket.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={isUpdatingIT}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-zenPrimary focus:border-zenPrimary sm:text-sm rounded-md"
            >
              {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {ticket.status}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Requested Priority</p>
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

        {isStaffOrAdmin && (
          <>
            <div>
              <p className="text-sm text-gray-500 font-semibold mb-1">IT Priority</p>
              <select
                value={ticket.itPriority || ''}
                onChange={(e) => handleUpdatePriority(e.target.value)}
                disabled={isUpdatingIT}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-zenPrimary focus:border-zenPrimary sm:text-sm rounded-md"
              >
                <option value="">-- Set IT Priority --</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold mb-1">Owner</p>
              <p className="text-gray-800 font-medium">{ticket.owner?.name || 'Unassigned'}</p>
            </div>
          </>
        )}
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

      <div className="border-t border-gray-200 pt-6 mb-8">
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
                  <button onClick={() => handleDownload(file.id, file.filename)} disabled={downloadLoading === file.id} className="px-3 py-1.5 text-xs font-semibold text-zenPrimary bg-zenPale hover:bg-zenPrimary hover:text-white rounded transition-colors disabled:opacity-50">
                    {downloadLoading === file.id ? 'Downloading...' : 'Download'}
                  </button>
                  <button onClick={() => handleDeleteAttachment(file.id)} disabled={deleteLoading === file.id} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded transition-colors disabled:opacity-50">
                    {deleteLoading === file.id ? '...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h5 className="text-sm font-bold text-gray-700 mb-3">Add Attachment</h5>
          {uploadError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{uploadError}</div>}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <input id="attachment-upload-input" type="file" onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setUploadError(null); }} disabled={isUploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zenPale file:text-zenPrimary hover:file:bg-zenPrimary hover:file:text-white file:transition-colors file:cursor-pointer cursor-pointer border border-gray-200 rounded p-1"/>
            <button onClick={handleUpload} disabled={!uploadFile || isUploading} className="px-4 py-2 bg-zenPrimary text-white text-sm font-semibold rounded shadow-sm hover:bg-zenSecondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center">
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        {isStaffOrAdmin ? (
          <div className="flex border-b border-gray-200 mb-6">
            <button 
              className={`px-6 py-3 font-semibold text-sm ${activeTab === 'public' ? 'border-b-2 border-zenPrimary text-zenPrimary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('public')}
            >
              Public Comments
            </button>
            <button 
              className={`px-6 py-3 font-semibold text-sm flex items-center ${activeTab === 'internal' ? 'border-b-2 border-yellow-600 text-yellow-700' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('internal')}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Internal Notes
            </button>
          </div>
        ) : (
          <h4 className="text-lg font-bold text-gray-800 mb-4">Comments</h4>
        )}
        
        {/* Public Comments Tab */}
        {activeTab === 'public' && (
          <div>
            {(!comments || comments.length === 0) ? (
              <p className="text-gray-500 italic mb-6">No comments yet</p>
            ) : (
              <ul className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <li key={comment.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-800">{comment.author.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">{comment.author.role}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h5 className="text-sm font-bold text-gray-700 mb-2">Add a Comment</h5>
              {commentError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{commentError}</div>}
              <textarea value={newComment} onChange={(e) => { setNewComment(e.target.value); setCommentError(null); }} placeholder="Type your comment here..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary mb-3" rows={3}></textarea>
              <div className="flex justify-end">
                <button onClick={handleAddComment} disabled={isSubmittingComment || !newComment.trim()} className="px-4 py-2 bg-zenPrimary text-white text-sm font-semibold rounded shadow-sm hover:bg-zenSecondary disabled:opacity-50 transition-colors">
                  {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Internal Notes Tab (IT & Admin only) */}
        {(isStaffOrAdmin && activeTab === 'internal') && (
          <div>
            {(!notes || notes.length === 0) ? (
              <p className="text-gray-500 italic mb-6">No internal notes yet</p>
            ) : (
              <ul className="space-y-4 mb-6">
                {notes.map((note) => (
                  <li key={note.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-yellow-800">{note.author.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-200 text-yellow-800">{note.author.role}</span>
                      </div>
                      <span className="text-xs text-yellow-600">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-yellow-900 whitespace-pre-wrap">{note.content}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h5 className="text-sm font-bold text-yellow-800 mb-2">Add an Internal Note</h5>
              {noteError && <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{noteError}</div>}
              <textarea value={newNote} onChange={(e) => { setNewNote(e.target.value); setNoteError(null); }} placeholder="Type internal note here (hidden from requesters)..." className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 mb-3 bg-white" rows={3}></textarea>
              <div className="flex justify-end">
                <button onClick={handleAddNote} disabled={isSubmittingNote || !newNote.trim()} className="px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded shadow-sm hover:bg-yellow-700 disabled:opacity-50 transition-colors">
                  {isSubmittingNote ? 'Submitting...' : 'Add Internal Note'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
