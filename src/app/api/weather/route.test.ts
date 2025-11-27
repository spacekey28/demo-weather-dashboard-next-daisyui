// Mock dependencies before importing route
jest.mock('@/lib/open-meteo', () => ({
  buildUrl: jest.fn(),
  isValidAU_NZCoords: jest.fn(),
}));

jest.mock('@/lib/schema', () => ({
  ZHourly: {
    safeParse: jest.fn(),
  },
  ZDaily: {
    safeParse: jest.fn(),
  },
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status ?? 200,
      ok: (init?.status ?? 200) < 400,
    })),
  },
}));

import { buildUrl, isValidAU_NZCoords } from '@/lib/open-meteo';
import { ZDaily, ZHourly } from '@/lib/schema';

import { GET } from './route';

// Mock global fetch
global.fetch = jest.fn();

describe('/api/weather route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (url: string): Request => {
    return new Request(url);
  };

  const mockValidHourlyResponse = {
    hourly: {
      time: ['2025-01-21T00:00', '2025-01-21T01:00'],
      temperature_2m: [20.5, 19.8],
      precipitation: [0, 0.5],
      windspeed_10m: [15.2, 18.3],
    },
  };

  const mockValidDailyResponse = {
    daily: {
      time: ['2025-01-21', '2025-01-22'],
      temperature_2m_max: [25.5, 26.2],
      temperature_2m_min: [18.3, 19.1],
      precipitation_sum: [0, 5.2],
      windspeed_10m_max: [20.1, 22.5],
    },
  };

  describe('Parameter validation', () => {
    it('should return 400 when lat is missing', async () => {
      const req = createMockRequest(
        'http://localhost/api/weather?lon=174.7645'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 when lon is missing', async () => {
      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 when lat is not a number', async () => {
      const req = createMockRequest(
        'http://localhost/api/weather?lat=invalid&lon=174.7645'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid coordinates');
    });

    it('should return 400 when lon is not a number', async () => {
      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=invalid'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid coordinates');
    });

    it('should return 400 when coordinates are outside AU/NZ bounds', async () => {
      (isValidAU_NZCoords as jest.Mock).mockReturnValue(false);

      const req = createMockRequest('http://localhost/api/weather?lat=0&lon=0');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Australia or New Zealand bounds');
    });
  });

  describe('Successful requests', () => {
    beforeEach(() => {
      (isValidAU_NZCoords as jest.Mock).mockReturnValue(true);
      (buildUrl as jest.Mock).mockReturnValue(
        'https://api.open-meteo.com/v1/forecast?latitude=-36.8509&longitude=174.7645'
      );
    });

    it('should return hourly data successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidHourlyResponse,
      });
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidHourlyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645&gran=hourly'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockValidHourlyResponse);
      expect(buildUrl).toHaveBeenCalledWith(
        { lat: -36.8509, lon: 174.7645 },
        'hourly',
        { vars: undefined, start: undefined, end: undefined }
      );
      expect(ZHourly.safeParse).toHaveBeenCalledWith(mockValidHourlyResponse);
    });

    it('should return daily data successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidDailyResponse,
      });
      (ZDaily.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidDailyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645&gran=daily'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockValidDailyResponse);
      expect(ZDaily.safeParse).toHaveBeenCalledWith(mockValidDailyResponse);
    });

    it('should default to hourly granularity when not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidHourlyResponse,
      });
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidHourlyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645'
      );
      await GET(req);

      expect(buildUrl).toHaveBeenCalledWith(
        { lat: -36.8509, lon: 174.7645 },
        'hourly',
        expect.any(Object)
      );
    });

    it('should parse vars parameter correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidHourlyResponse,
      });
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidHourlyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645&vars=temperature_2m,precipitation'
      );
      await GET(req);

      expect(buildUrl).toHaveBeenCalledWith(
        { lat: -36.8509, lon: 174.7645 },
        'hourly',
        {
          vars: ['temperature_2m', 'precipitation'],
          start: undefined,
          end: undefined,
        }
      );
    });

    it('should parse start and end date parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidHourlyResponse,
      });
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidHourlyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645&start=2025-01-01&end=2025-01-07'
      );
      await GET(req);

      expect(buildUrl).toHaveBeenCalledWith(
        { lat: -36.8509, lon: 174.7645 },
        'hourly',
        {
          vars: undefined,
          start: '2025-01-01',
          end: '2025-01-07',
        }
      );
    });
  });

  describe('Retry logic', () => {
    beforeEach(() => {
      (isValidAU_NZCoords as jest.Mock).mockReturnValue(true);
      (buildUrl as jest.Mock).mockReturnValue(
        'https://api.open-meteo.com/v1/forecast'
      );
      // Use real timers - we'll verify retry behavior by call counts
      jest.useRealTimers();
    });

    it('should retry on failed fetch (non-ok response) and succeed on third attempt', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockValidHourlyResponse,
        });
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidHourlyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645'
      );

      const response = await GET(req);
      expect(response.status).toBe(200);
      // Verify fetch was called 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on fetch error (network error) and succeed on third attempt', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockValidHourlyResponse,
        });
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidHourlyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645'
      );

      const response = await GET(req);
      expect(response.status).toBe(200);
      // Verify fetch was called 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should return 502 after all retries fail', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toContain('Failed to fetch weather data');
      // Verify fetch was called 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry up to 3 times total', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(502);
      // After all retries fail, fetchWithRetry throws an error which is caught
      expect(data.error).toBe('Failed to fetch weather data');
      // Verify fetch was called exactly 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      (isValidAU_NZCoords as jest.Mock).mockReturnValue(true);
      (buildUrl as jest.Mock).mockReturnValue(
        'https://api.open-meteo.com/v1/forecast'
      );
    });

    it('should return 502 when upstream API returns non-ok response after retries', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(502);
      // After all retries fail, fetchWithRetry throws an error which is caught
      expect(data.error).toBe('Failed to fetch weather data');
      // Verify retries happened
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should return 500 when response fails schema validation', async () => {
      jest.useRealTimers();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {
          errors: [{ path: ['hourly'], message: 'Required' }],
        },
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645&gran=hourly'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid schema');
      expect(data.details).toBeDefined();
    });

    it('should handle unexpected errors gracefully', async () => {
      (buildUrl as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toContain('Failed to fetch weather data');
    });
  });

  describe('Response validation', () => {
    beforeEach(() => {
      (isValidAU_NZCoords as jest.Mock).mockReturnValue(true);
      (buildUrl as jest.Mock).mockReturnValue(
        'https://api.open-meteo.com/v1/forecast'
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockValidHourlyResponse,
      });
      // Use real timers for these tests
      jest.useRealTimers();
    });

    it('should validate hourly response with ZHourly schema', async () => {
      (ZHourly.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidHourlyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645&gran=hourly'
      );
      await GET(req);

      expect(ZHourly.safeParse).toHaveBeenCalledWith(mockValidHourlyResponse);
      expect(ZDaily.safeParse).not.toHaveBeenCalled();
    });

    it('should validate daily response with ZDaily schema', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockValidDailyResponse,
      });
      (ZDaily.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockValidDailyResponse,
      });

      const req = createMockRequest(
        'http://localhost/api/weather?lat=-36.8509&lon=174.7645&gran=daily'
      );
      await GET(req);

      expect(ZDaily.safeParse).toHaveBeenCalledWith(mockValidDailyResponse);
      expect(ZHourly.safeParse).not.toHaveBeenCalled();
    });
  });
});
