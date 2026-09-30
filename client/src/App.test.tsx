/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

expect.extend(matchers);
import App from './App';

vi.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User' },
    logout: vi.fn(),
  }),
}));

describe('App Category List UI', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render all 4 categories successfully', async () => {
    const mockCategories = [
      { id: 1, name: 'Account and Access' },
      { id: 2, name: 'Hardware' },
      { id: 3, name: 'Software' },
      { id: 4, name: 'Network' },
    ];

    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCategories,
      });
    });

    render(<App />);

    // Wait for the 4 categories to be rendered in the document
    await waitFor(() => {
      expect(screen.getByText('Account and Access')).toBeInTheDocument();
      expect(screen.getByText('Hardware')).toBeInTheDocument();
      expect(screen.getByText('Software')).toBeInTheDocument();
      expect(screen.getByText('Network')).toBeInTheDocument();
    });
  });
});
