/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

expect.extend(matchers);

import { RequesterDashboard } from '../components/RequesterDashboard';
import * as api from '../api';

let currentUser = {
  id: 'req-1',
  name: 'Alice Requester',
  email: 'alice@toktickit.dev',
  role: 'REQUESTER',
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentUser,
    isLoading: false,
  }),
}));

vi.mock('../api', () => ({
  getRequesterDashboard: vi.fn(),
}));

describe('RequesterDashboard Component (ISSUE-05: DASH-07)', () => {
  const mockRequesterData = {
    metrics: {
      totalOpen: 3,
      waitingForRequester: 1,
      recentlyUpdated: 2,
      recentlyResolved: 1,
    },
    recentTickets: [
      {
        id: 'tkt-req-1',
        ticketNumber: 'TKT-0042',
        summary: 'VPN connection drops frequently',
        status: 'WAITING_FOR_REQUESTER',
        requestedPriority: 'HIGH',
        updatedAt: '2026-10-07T09:30:00.000Z',
      },
      {
        id: 'tkt-req-2',
        ticketNumber: 'TKT-0045',
        summary: 'Request second monitor for desk',
        status: 'IN_PROGRESS',
        requestedPriority: 'MEDIUM',
        updatedAt: '2026-10-06T14:15:00.000Z',
      },
    ],
  };

  const emptyRequesterData = {
    metrics: {
      totalOpen: 0,
      waitingForRequester: 0,
      recentlyUpdated: 0,
      recentlyResolved: 0,
    },
    recentTickets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = {
      id: 'req-1',
      name: 'Alice Requester',
      email: 'alice@toktickit.dev',
      role: 'REQUESTER',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-07: Renders personal metrics and own recent tickets
  // ──────────────────────────────────────────────────────────────────────────
  it('DASH-07: renders only personal ticket metrics and recent support ticket summaries', async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(mockRequesterData);
    const mockOnSelectTicket = vi.fn();

    render(
      <RequesterDashboard
        onNavigate={vi.fn()}
        onSelectTicket={mockOnSelectTicket}
        onCreateTicket={vi.fn()}
      />
    );

    // Verify metrics are loaded and rendered
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // totalOpen
    });

    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); // waitingForRequester / recentlyResolved
    expect(screen.getByText('2')).toBeInTheDocument(); // recentlyUpdated

    // Verify personal ticket rows are displayed
    expect(screen.getByText('TKT-0042')).toBeInTheDocument();
    expect(screen.getByText('VPN connection drops frequently')).toBeInTheDocument();
    expect(screen.getByText('TKT-0045')).toBeInTheDocument();
    expect(screen.getByText('Request second monitor for desk')).toBeInTheDocument();

    // Verify drill-down click to view details of a ticket
    const viewBtn = screen.getAllByRole('button', { name: /view details/i })[0];
    fireEvent.click(viewBtn);
    expect(mockOnSelectTicket).toHaveBeenCalledWith('tkt-req-1');
  });

  it('DASH-07 (Empty State): displays empty state guidance when requester has no tickets', async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(emptyRequesterData);
    const mockOnCreateTicket = vi.fn();

    render(
      <RequesterDashboard
        onNavigate={vi.fn()}
        onSelectTicket={vi.fn()}
        onCreateTicket={mockOnCreateTicket}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify empty state message
    expect(screen.getByText(/no active support tickets/i)).toBeInTheDocument();

    // Verify Call to Action button triggers ticket creation
    const createBtn = screen.getAllByRole('button', { name: /create support ticket/i })[0];
    fireEvent.click(createBtn);
    expect(mockOnCreateTicket).toHaveBeenCalled();
  });
});
