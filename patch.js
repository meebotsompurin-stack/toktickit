const fs = require('fs');

let content = fs.readFileSync('client/src/components/TicketDetail.tsx', 'utf8');

// Update imports
content = content.replace(
  "import { getTicketById, deleteAttachment, uploadAttachmentToTicket, downloadAttachment } from '../api';",
  "import { getTicketById, deleteAttachment, uploadAttachmentToTicket, downloadAttachment, addPublicComment, toggleAppearsResolved } from '../api';"
);

// Update Interface
const interface_code = `
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
  requestedPriority: string;
  status: string;
  summary: string;
  description: string;
  createdAt: string;
  appearsResolved: boolean;
  category?: { name: string };
  relatedSystem?: { name: string };
  attachments?: Attachment[];
  comments?: Comment[];
}
`;
content = content.replace(/interface Ticket \{[\s\S]*?\n\}/, interface_code);

// Add states for comments and resolved
const states_code = `
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isTogglingResolved, setIsTogglingResolved] = useState(false);

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

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setCommentError('Comment content cannot be empty');
      return;
    }
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const created = await addPublicComment(ticketId, newComment);
      if (ticket) {
        setTicket({
          ...ticket,
          comments: [...(ticket.comments || []), created]
        });
      }
      setNewComment('');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };
`;
content = content.replace('  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);', states_code);

// Add UI for Appears Resolved in the header
const resolved_ui = `
      <div className="flex justify-between items-end mb-6 border-b pb-4 border-zenPrimary">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{ticket.ticketNumber}</h2>
          <p className="text-sm text-gray-500 mt-1">Created on {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <button
            onClick={handleToggleResolved}
            disabled={isTogglingResolved}
            className={\`px-4 py-2 text-sm font-semibold rounded shadow-sm transition-colors \${
              ticket.appearsResolved ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } disabled:opacity-50\`}
          >
            {ticket.appearsResolved ? '✅ Appears Resolved' : 'Mark as Resolved'}
          </button>
        </div>
      </div>
`;
content = content.replace(/<div className="flex justify-between items-end mb-6 border-b pb-4 border-zenPrimary">[\s\S]*?<\/div>\s*<\/div>/, resolved_ui);

// Add Comments Section at the bottom before final closing divs
const comments_ui = `
      {/* Comments Section */}
      <div className="border-t border-gray-200 pt-6 mt-8">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Comments</h4>
        
        {(!ticket.comments || ticket.comments.length === 0) ? (
          <p className="text-gray-500 italic mb-6">No comments yet</p>
        ) : (
          <ul className="space-y-4 mb-6">
            {ticket.comments.map((comment) => (
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

        {/* Add Comment Form */}
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <h5 className="text-sm font-bold text-gray-700 mb-2">Add a Comment</h5>
          {commentError && (
            <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {commentError}
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => { setNewComment(e.target.value); setCommentError(null); }}
            placeholder="Type your comment here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary mb-3"
            rows={3}
          ></textarea>
          <div className="flex justify-end">
            <button
              onClick={handleAddComment}
              disabled={isSubmittingComment || !newComment.trim()}
              className="px-4 py-2 bg-zenPrimary text-white text-sm font-semibold rounded shadow-sm hover:bg-zenSecondary disabled:opacity-50 transition-colors"
            >
              {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
`;
content = content.replace('    </div>\n  );\n};', comments_ui);

fs.writeFileSync('client/src/components/TicketDetail.tsx', content);
