/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

expect.extend(matchers);

import { StaffDashboard } from '../components/StaffDashboard';
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
  getStaffDashboard: vi.fn(),
}));

describe('StaffDashboard Component (ISSUE-05: DASH-06, DASH-08, DASH-09)', () => {
  const mockDashboardData = {
    metrics: {
      unassigned: 5,
      ownedByMe: 8,
      recentlyUpdated: 12,
      byStatus: {
        NEW: 3,
        OPEN: 4,
        IN_PROGRESS: 6,
        WAITING_FOR_REQUESTER: 2,
        RESOLVED: 5,
        CLOSED: 20,
        REOPENED: 1,
        CANCELLED: 2,
      },
      byItPriority: {
        CRITICAL: 2,
        HIGH: 4,
        MEDIUM: 10,
        LOW: 5,
      },
    },
    urgentTickets: [
      {
        id: 'tkt-urgent-1',
        ticketNumber: 'TKT-0099',
        summary: 'Core switch packet loss',
        status: 'OPEN',
        itPriority: 'CRITICAL',
        ownerName: 'Unassigned',
        updatedAt: '2026-10-07T09:00:00.000Z',
      },
    ],
  };

  const emptyDashboardData = {
    metrics: {
      unassigned: 0,
      ownedByMe: 0,
      recentlyUpdated: 0,
      byStatus: {
        NEW: 0,
        OPEN: 0,
        IN_PROGRESS: 0,
        WAITING_FOR_REQUESTER: 0,
        RESOLVED: 0,
        CLOSED: 0,
        REOPENED: 0,
        CANCELLED: 0,
      },
      byItPriority: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
    },
    urgentTickets: [],
  };

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
  // DASH-06: Renders all metric cards and urgent list correctly
  // ──────────────────────────────────────────────────────────────────────────
  it('DASH-06: renders metric cards and urgent ticket list with correct values', async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockDashboardData);

    render(<StaffDashboard onNavigate={vi.fn()} onSelectTicket={vi.fn()} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1); // unassigned
    });

    expect(screen.getByText('8')).toBeInTheDocument(); // ownedByMe
    expect(screen.getByText('12')).toBeInTheDocument(); // recentlyUpdated

    // Check headings and labels
    expect(screen.getAllByText(/unassigned/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/owned by me/i).length).toBeGreaterThanOrEqual(1);

    // Check urgent ticket item
    expect(screen.getByText('TKT-0099')).toBeInTheDocument();
    expect(screen.getByText('Core switch packet loss')).toBeInTheDocument();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-08: Drill-down clicks navigate to correct filtered view
  // ──────────────────────────────────────────────────────────────────────────
  it('DASH-08: drill-down click on metric card or urgent ticket triggers navigation callback', async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockDashboardData);
    const mockOnNavigate = vi.fn();
    const mockOnSelectTicket = vi.fn();

    render(
      <StaffDashboard
        onNavigate={mockOnNavigate}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('TKT-0099')).toBeInTheDocument();
    });

    // Clicking an action button or link for unassigned drill-down
    const unassignedBtn = screen.getByRole('button', { name: /view queue/i });
    fireEvent.click(unassignedBtn);
    expect(mockOnNavigate).toHaveBeenCalled();

    // Clicking on the urgent ticket to open detail view
    const openTicketBtn = screen.getAllByRole('button', { name: /open ticket/i })[0];
    fireEvent.click(openTicketBtn);
    expect(mockOnSelectTicket).toHaveBeenCalledWith('tkt-urgent-1');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DASH-09: Empty state displayed when all metrics are zero
  // ──────────────────────────────────────────────────────────────────────────
  it('DASH-09: renders empty state when all metrics and urgent tickets are zero', async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValue(emptyDashboardData);

    render(<StaffDashboard onNavigate={vi.fn()} onSelectTicket={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Displays empty state guidance or zero indicators
    expect(screen.getByText(/no tickets found/i)).toBeInTheDocument();
  });
});
