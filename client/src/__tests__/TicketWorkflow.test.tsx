/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

expect.extend(matchers);

import { TicketDetail } from '../components/TicketDetail';
import * as api from '../api';

let currentUser = {
  id: 'staff-1',
  name: 'Frank Staff',
  email: 'frank@toktickit.dev',
  role: 'IT_STAFF',
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentUser,
    isLoading: false,
  }),
}));

vi.mock('../api', () => ({
  getTicketById: vi.fn(),
  updateStaffTicketStatus: vi.fn(),
  updateStaffTicketOwner: vi.fn(),
  updateStaffTicketPriority: vi.fn(),
  toggleAppearsResolved: vi.fn(),
  getTicketComments: vi.fn().mockResolvedValue([]),
  getTicketNotes: vi.fn().mockResolvedValue([]),
  getActions: vi.fn().mockResolvedValue([]),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  uploadAttachmentToTicket: vi.fn(),
  addPublicComment: vi.fn(),
  addTicketNote: vi.fn(),
  createAction: vi.fn(),
  updateAction: vi.fn(),
}));

describe('Ticket Workflow & Status Transitions (ISSUE-04: WORK-07 & WORK-08)', () => {
  const mockTicket = {
    id: 'tkt-1',
    ticketNumber: 'TKT-001',
    status: 'NEW',
    version: 1,
    requesterId: 'req-1',
    ownerId: null,
    owner: null,
    requestedPriority: 'Medium',
    itPriority: null,
    summary: 'Email client synchronization error',
    description: 'Outlook cannot synchronize with IMAP server after password update',
    createdAt: '2026-10-07T08:00:00.000Z',
    appearsResolved: false,
    category: { name: 'Software' },
    relatedSystem: { name: 'Email' },
    attachments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = {
      id: 'staff-1',
      name: 'Frank Staff',
      email: 'frank@toktickit.dev',
      role: 'IT_STAFF',
    };
    vi.mocked(api.getTicketById).mockResolvedValue(mockTicket);
    vi.mocked(api.getTicketComments).mockResolvedValue([]);
    vi.mocked(api.getTicketNotes).mockResolvedValue([]);
    vi.mocked(api.getActions).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-07: Status dropdown shows only permitted transitions
  // ──────────────────────────────────────────────────────────────────────────
  it('WORK-07: status dropdown displays only permitted transitions from current status and role', async () => {
    // Ticket starts in NEW status. For IT_STAFF, permitted next statuses are OPEN and CANCELLED.
    // Illegal transitions from NEW: CLOSED, RESOLVED, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED.
    render(<TicketDetail ticketId="tkt-1" onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('NEW')).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole('combobox', { name: /status/i }) || screen.getByDisplayValue('NEW');
    expect(statusSelect).toBeInTheDocument();

    // Permitted options should be present
    expect(screen.getByRole('option', { name: 'NEW' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'OPEN' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'CANCELLED' })).toBeInTheDocument();

    // Disallowed transitions from NEW must NOT be rendered in the dropdown
    expect(screen.queryByRole('option', { name: 'CLOSED' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'RESOLVED' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'IN_PROGRESS' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'WAITING_FOR_REQUESTER' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'REOPENED' })).not.toBeInTheDocument();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WORK-08: Double-click submit prevention
  // ──────────────────────────────────────────────────────────────────────────
  it('WORK-08: prevents duplicate status transition requests from rapid double-clicks', async () => {
    // Return a delayed promise to simulate pending network request
    let resolveRequest: (val: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    vi.mocked(api.updateStaffTicketStatus).mockReturnValue(pendingPromise as any);

    render(<TicketDetail ticketId="tkt-1" onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('NEW')).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole('combobox', { name: /status/i }) || screen.getByDisplayValue('NEW');

    // Simulate first change trigger
    fireEvent.change(statusSelect, { target: { value: 'OPEN' } });

    // Simulate immediate rapid second change/click while first request is pending
    fireEvent.change(statusSelect, { target: { value: 'OPEN' } });

    // Only one update API call must have been sent
    expect(api.updateStaffTicketStatus).toHaveBeenCalledTimes(1);

    // Resolve the promise to clean up
    resolveRequest!({ ...mockTicket, status: 'OPEN', version: 2 });
  });
});
