import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getActions, 
  createAction, 
  updateAction, 
  type ActionTaken, 
  type CreateActionPayload, 
  type UpdateActionPayload 
} from '../api';

interface Props {
  ticketId: string;
}

export const ActionsTaken: React.FC<Props> = ({ ticketId }) => {
  const { user } = useAuth();
  const isRequester = user?.role === 'REQUESTER';

  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    result: '',
    followUpRequired: false,
    followUpNote: '',
    attachmentNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActions(ticketId);
      setActions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch actions taken:', err);
      setError(err.message || 'Failed to load actions taken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchActions();
    }
  }, [ticketId]);

  const handleOpenCreateForm = () => {
    setEditingActionId(null);
    setFormData({
      description: '',
      result: '',
      followUpRequired: false,
      followUpNote: '',
      attachmentNotes: '',
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (action: ActionTaken) => {
    setEditingActionId(action.id);
    setFormData({
      description: action.description,
      result: action.result,
      followUpRequired: action.followUpRequired,
      followUpNote: action.followUpNote || '',
      attachmentNotes: action.attachmentNotes || '',
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingActionId(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (formData.followUpRequired && !formData.followUpNote.trim()) {
      setFormError('Follow-up note is required when follow-up is needed.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingActionId) {
        const payload: UpdateActionPayload = {
          description: formData.description.trim(),
          result: formData.result.trim(),
          followUpRequired: formData.followUpRequired,
          followUpNote: formData.followUpRequired ? formData.followUpNote.trim() : null,
          attachmentNotes: formData.attachmentNotes.trim() || null,
        };
        await updateAction(ticketId, editingActionId, payload);
        setFormSuccess('Action taken successfully updated.');
      } else {
        const payload: CreateActionPayload = {
          actionDateTime: new Date().toISOString(),
          description: formData.description.trim(),
          result: formData.result.trim(),
          followUpRequired: formData.followUpRequired,
          followUpNote: formData.followUpRequired ? formData.followUpNote.trim() : null,
          attachmentNotes: formData.attachmentNotes.trim() || null,
        };
        await createAction(ticketId, payload);
        setFormSuccess('Action taken successfully recorded.');
      }

      await fetchActions();
      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Failed to save action taken:', err);
      // Preserves entered data upon failure
      setFormError(err.message || 'Failed to save action taken. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4 bg-white">
      {/* Header */}
      <div className="card-header bg-emerald-50 border-bottom border-emerald-100 d-flex justify-content-between align-items-center py-3">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-emerald-600 text-white rounded-pill px-2.5 py-1 text-xs">
            {actions.length}
          </span>
          <h5 className="mb-0 text-emerald-950 font-semibold text-lg">Actions Taken</h5>
        </div>
        {!isRequester && (
          <button
            type="button"
            className="btn btn-sm btn-success bg-emerald-600 hover:bg-emerald-700 text-white border-0 d-flex align-items-center gap-1 shadow-sm"
            onClick={handleOpenCreateForm}
          >
            <span>+</span> Record Action Taken
          </button>
        )}
      </div>

      {/* Body */}
      <div className="card-body p-4">
        {/* Alerts */}
        {formSuccess && (
          <div className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-3">
            <span>{formSuccess}</span>
            <button type="button" className="btn-close btn-close-white" onClick={() => setFormSuccess(null)} />
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3">
            <span>{error}</span>
          </div>
        )}

        {/* Modal / Inline Form for Add & Edit */}
        {isFormOpen && (
          <div className="card border border-emerald-300 bg-slate-50 mb-4 p-3 shadow-sm rounded-lg">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="font-semibold text-emerald-900 mb-0">
                {editingActionId ? 'Edit Action Taken' : 'Record New Action Taken'}
              </h6>
              <button
                type="button"
                className="btn-close"
                aria-label="Close form"
                onClick={handleCloseForm}
              />
            </div>

            {formError && (
              <div className="alert alert-danger py-2 px-3 mb-3 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="action-description" className="form-label font-medium text-slate-700 text-sm">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="action-description"
                  aria-label="Description"
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Describe the technical action or troubleshooting performed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="action-result" className="form-label font-medium text-slate-700 text-sm">
                  Result <span className="text-danger">*</span>
                </label>
                <textarea
                  id="action-result"
                  aria-label="Result"
                  className="form-control"
                  rows={2}
                  required
                  placeholder="Outcome or result of the action taken..."
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                />
              </div>

              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="action-followup-req"
                  aria-label="Follow-Up Required"
                  checked={formData.followUpRequired}
                  onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                />
                <label htmlFor="action-followup-req" className="form-check-label text-slate-700 text-sm">
                  Follow-Up Required
                </label>
              </div>

              {formData.followUpRequired && (
                <div className="mb-3">
                  <label htmlFor="action-followup-note" className="form-label font-medium text-slate-700 text-sm">
                    Follow-Up Note <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="action-followup-note"
                    aria-label="Follow-Up Note"
                    className="form-control border-amber-300"
                    rows={2}
                    required
                    placeholder="Details about next steps, monitoring, or future actions..."
                    value={formData.followUpNote}
                    onChange={(e) => setFormData({ ...formData, followUpNote: e.target.value })}
                  />
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="action-attachment-notes" className="form-label font-medium text-slate-700 text-sm">
                  Attachment Notes (Optional)
                </label>
                <input
                  type="text"
                  id="action-attachment-notes"
                  aria-label="Attachment Notes"
                  className="form-control"
                  placeholder="e.g. See network_log.txt or screenshot #1"
                  value={formData.attachmentNotes}
                  onChange={(e) => setFormData({ ...formData, attachmentNotes: e.target.value })}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleCloseForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-success bg-emerald-600 hover:bg-emerald-700 border-0"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Action Taken'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <div className="text-center py-4 text-slate-500">
            <div className="spinner-border spinner-border-sm text-emerald-600 me-2" role="status" />
            <span>Loading actions taken...</span>
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-4 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
            <p className="text-slate-500 mb-0 font-medium">No actions taken yet.</p>
            <p className="text-slate-400 text-xs mt-1 mb-0">
              {isRequester
                ? 'Your assigned IT technician has not recorded technical actions yet.'
                : 'Click "Record Action Taken" to document technical work on this ticket.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" style={{ width: '15%' }}>Date & Time</th>
                  <th scope="col" style={{ width: '15%' }}>Performed By</th>
                  <th scope="col" style={{ width: '25%' }}>Description</th>
                  <th scope="col" style={{ width: '20%' }}>Result</th>
                  <th scope="col" style={{ width: '15%' }}>Follow-Up</th>
                  {!isRequester && <th scope="col" style={{ width: '10%' }} className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {actions.map((act) => (
                  <tr key={act.id}>
                    {/* Date */}
                    <td className="text-slate-500 text-xs">
                      {act.actionDateTime
                        ? new Date(act.actionDateTime).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>

                    {/* Performed By */}
                    <td>
                      <div className="font-medium text-slate-800">
                        {act.performedBy?.name || act.performedById}
                      </div>
                      {act.performedBy?.email && (
                        <div className="text-slate-400 text-xs">{act.performedBy.email}</div>
                      )}
                    </td>

                    {/* Description */}
                    <td>
                      <div className="text-slate-800">{act.description}</div>
                      {act.attachmentNotes && (
                        <div className="mt-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded d-inline-block">
                          📎 {act.attachmentNotes}
                        </div>
                      )}
                    </td>

                    {/* Result */}
                    <td className="text-slate-700">
                      <div>{act.result}</div>
                    </td>

                    {/* Follow-Up */}
                    <td>
                      {act.followUpRequired ? (
                        <div>
                          <span className="badge bg-amber-100 text-amber-800 border border-amber-200 text-xs">
                            Follow-Up Needed
                          </span>
                          {act.followUpNote && (
                            <p className="mt-1 text-xs text-amber-900 mb-0 font-medium">
                              Note: {act.followUpNote}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600 text-xs">
                          No Follow-Up
                        </span>
                      )}
                    </td>

                    {/* Action buttons (Staff/Admin only) */}
                    {!isRequester && (
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleOpenEditForm(act)}
                        >
                          Edit Action
                        </button>
                      </td>
                    )}
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
