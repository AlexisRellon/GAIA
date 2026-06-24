/**
 * HazardExport Component Tests
 * Module: RG-01 (Compliance Export Frontend)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HazardExport } from './HazardExport';

// --- Mocks -----------------------------------------------------------------
const mockGetSession = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
  },
}));

const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('sonner', () => ({ toast: { success: (m: string) => mockToast.success(m), error: (m: string) => mockToast.error(m) } }));

const sampleHazard = {
  id: 'haz-1',
  hazard_type: 'flood',
  severity: 'severe',
  location_name: 'Quezon City',
  latitude: 14.676,
  longitude: 121.0437,
  confidence_score: 0.9,
  source_type: 'rss',
  validated: true,
  created_at: '2026-06-20T03:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: 'token-123', user: { email: 'admin@example.com' } } },
  });
  // jsdom lacks these blob/URL APIs.
  global.URL.createObjectURL = jest.fn(() => 'blob:url');
  global.URL.revokeObjectURL = jest.fn();
});

describe('HazardExport', () => {
  it('renders both export buttons with the hazard count', () => {
    render(<HazardExport hazards={[sampleHazard]} />);

    expect(screen.getByText('Export (1)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export filtered hazards as GeoJSON/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export filtered hazards as CSV/i })).toBeInTheDocument();
  });

  it('does not call the API when there are no hazards', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    render(<HazardExport hazards={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /Export filtered hazards as GeoJSON/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalled();
  });

  it('POSTs to the GeoJSON endpoint with an auth header on click', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['{}'], { type: 'application/geo+json' }),
    } as unknown as Response);

    const onExported = jest.fn();
    render(<HazardExport hazards={[sampleHazard]} onExported={onExported} />);

    fireEvent.click(screen.getByRole('button', { name: /Export filtered hazards as GeoJSON/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/api/v1/reports/export/geojson');
    expect((options as RequestInit).method).toBe('POST');
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer token-123',
    });

    await waitFor(() => expect(onExported).toHaveBeenCalledWith('geojson'));
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('shows an error toast when the API responds with an error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      json: async () => ({ detail: 'Access denied' }),
    } as unknown as Response);

    render(<HazardExport hazards={[sampleHazard]} />);
    fireEvent.click(screen.getByRole('button', { name: /Export filtered hazards as CSV/i }));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Access denied'));
  });
});
