/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

expect.extend(matchers);

import { ActionsTaken } from '../components/ActionsTaken';
import * as api from '../api';

// Mock AuthContext
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

// Mock API module
vi.mock('../api', () => ({
  getActions: vi.fn(),
  createAction: vi.fn(),
  updateAction: vi.fn(),
}));

describe('ActionsTaken Component (ISSUE-03)', () => {
  const mockTicketId = 'TKT-001';

  const sampleActions = [
    {
      id: 'act-1',
      ticketId: mockTicketId,
      actionDateTime: '2026-10-07T10:30:00.000Z',
      description: 'Replaced faulty RAM stick in server rack 2',
      result: 'Server booted successfully with 64GB detected',
      performedById: 'staff-1',
      performedBy: {
        id: 'staff-1',
        name: 'Frank Staff',
        email: 'frank@toktickit.dev',
      },
      followUpRequired: true,
      followUpNote: 'Monitor memory error logs for next 24 hours',
      attachmentNotes: 'Memory diagnostic report attached in ticket',
      createdAt: '2026-10-07T10:30:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = {
      id: 'staff-1',
      name: 'Frank Staff',
      email: 'frank@toktickit.dev',
      role: 'IT_STAFF',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACTION-09: Renders list of actions with all fields
  // ──────────────────────────────────────────────────────────────────────────
  it('ACTION-09: renders list of actions with all fields', async () => {
    vi.mocked(api.getActions).mockResolvedValue(sampleActions);

    render(<ActionsTaken ticketId={mockTicketId} />);

    // Wait for actions to load and verify all required fields appear
    await waitFor(() => {
      expect(screen.getByText(/Replaced faulty RAM stick in server rack 2/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Server booted successfully with 64GB detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Frank Staff/i)).toBeInTheDocument();
    expect(screen.getByText(/Monitor memory error logs for next 24 hours/i)).toBeInTheDocument();
    expect(screen.getByText(/Memory diagnostic report attached in ticket/i)).toBeInTheDocument();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACTION-10: Create form submits valid data and triggers success feedback
  // ──────────────────────────────────────────────────────────────────────────
  it('ACTION-10: create form submits valid data and triggers success feedback', async () => {
    vi.mocked(api.getActions).mockResolvedValue([]);
    vi.mocked(api.createAction).mockResolvedValue({
      id: 'act-new',
      ticketId: mockTicketId,
      actionDateTime: '2026-10-07T10:00:00.000Z',
      description: 'Rebooted network switch',
      result: 'Port connectivity restored',
      performedById: 'staff-1',
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
      createdAt: '2026-10-07T10:00:00.000Z',
    });

    render(<ActionsTaken ticketId={mockTicketId} />);

    await waitFor(() => {
      expect(api.getActions).toHaveBeenCalled();
    });

    // Open create form
    const addBtn = screen.getByRole('button', { name: /add action|record action|create action/i });
    fireEvent.click(addBtn);

    // Fill in required form inputs
    const descInput = screen.getByLabelText(/description/i);
    const resultInput = screen.getByLabelText(/result/i);

    fireEvent.change(descInput, { target: { value: 'Rebooted network switch' } });
    fireEvent.change(resultInput, { target: { value: 'Port connectivity restored' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /^save action|submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createAction).toHaveBeenCalledWith(
        mockTicketId,
        expect.objectContaining({
          description: 'Rebooted network switch',
          result: 'Port connectivity restored',
        })
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACTION-11: Create form conditional rendering for followUpNote
  // ──────────────────────────────────────────────────────────────────────────
  it('ACTION-11: checking followUpRequired reveals the followUpNote field and makes it required', async () => {
    vi.mocked(api.getActions).mockResolvedValue([]);

    render(<ActionsTaken ticketId={mockTicketId} />);

    await waitFor(() => {
      expect(api.getActions).toHaveBeenCalled();
    });

    // Open create form
    const addBtn = screen.getByRole('button', { name: /add action|record action|create action/i });
    fireEvent.click(addBtn);

    // Initially, follow-up note input should either not be rendered or not required
    const followUpCheckbox = screen.getByLabelText(/follow-up required/i);
    expect(followUpCheckbox).not.toBeChecked();
    expect(screen.queryByLabelText(/follow-up note/i)).not.toBeInTheDocument();

    // Check followUpRequired
    fireEvent.click(followUpCheckbox);
    expect(followUpCheckbox).toBeChecked();

    // Now followUpNote must appear and be required
    const noteInput = screen.getByLabelText(/follow-up note/i);
    expect(noteInput).toBeInTheDocument();
    expect(noteInput).toBeRequired();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACTION-12: Role-based access: Requesters cannot create or edit actions
  // ──────────────────────────────────────────────────────────────────────────
  it('ACTION-12: hides Create and Edit buttons for REQUESTER role', async () => {
    currentUser = {
      id: 'req-1',
      name: 'Alice Requester',
      email: 'alice@toktickit.dev',
      role: 'REQUESTER',
    };

    vi.mocked(api.getActions).mockResolvedValue(sampleActions);

    render(<ActionsTaken ticketId={mockTicketId} />);

    // Actions list still renders for Requester
    await waitFor(() => {
      expect(screen.getByText(/Replaced faulty RAM stick in server rack 2/i)).toBeInTheDocument();
    });

    // But Add/Create and Edit buttons are strictly hidden
    expect(
      screen.queryByRole('button', { name: /add action|record action|create action/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit action|edit/i })).not.toBeInTheDocument();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACTION-13: Empty state
  // ──────────────────────────────────────────────────────────────────────────
  it('ACTION-13: displays "No actions taken yet" when actions list is empty', async () => {
    vi.mocked(api.getActions).mockResolvedValue([]);

    render(<ActionsTaken ticketId={mockTicketId} />);

    await waitFor(() => {
      expect(screen.getByText(/no actions taken yet/i)).toBeInTheDocument();
    });
  });
});
