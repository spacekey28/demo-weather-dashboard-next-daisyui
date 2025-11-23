import { type Coords, buildUrl, isValidAU_NZCoords } from './open-meteo';

describe('open-meteo', () => {
  describe('isValidAU_NZCoords', () => {
    describe('Australia coordinates', () => {
      it('should return true for Sydney coordinates', () => {
        const coords: Coords = { lat: -33.8688, lon: 151.2093 };
        expect(isValidAU_NZCoords(coords)).toBe(true);
      });

      it('should return true for Melbourne coordinates', () => {
        const coords: Coords = { lat: -37.8136, lon: 144.9631 };
        expect(isValidAU_NZCoords(coords)).toBe(true);
      });

      it('should return true for Brisbane coordinates', () => {
        const coords: Coords = { lat: -27.4698, lon: 153.0251 };
        expect(isValidAU_NZCoords(coords)).toBe(true);
      });

      it('should return true for coordinates at Australia boundaries', () => {
        // Northern boundary
        expect(isValidAU_NZCoords({ lat: -10.7, lon: 133.0 })).toBe(true);
        // Southern boundary
        expect(isValidAU_NZCoords({ lat: -43.6, lon: 133.0 })).toBe(true);
        // Eastern boundary
        expect(isValidAU_NZCoords({ lat: -25.0, lon: 153.6 })).toBe(true);
        // Western boundary
        expect(isValidAU_NZCoords({ lat: -25.0, lon: 113.3 })).toBe(true);
      });
    });

    describe('New Zealand coordinates', () => {
      it('should return true for Auckland coordinates', () => {
        const coords: Coords = { lat: -36.8509, lon: 174.7645 };
        expect(isValidAU_NZCoords(coords)).toBe(true);
      });

      it('should return true for Wellington coordinates', () => {
        const coords: Coords = { lat: -41.2865, lon: 174.7762 };
        expect(isValidAU_NZCoords(coords)).toBe(true);
      });

      it('should return true for coordinates at New Zealand boundaries', () => {
        // Northern boundary
        expect(isValidAU_NZCoords({ lat: -34.4, lon: 172.0 })).toBe(true);
        // Southern boundary
        expect(isValidAU_NZCoords({ lat: -47.3, lon: 172.0 })).toBe(true);
        // Eastern boundary
        expect(isValidAU_NZCoords({ lat: -40.0, lon: 178.6 })).toBe(true);
        // Western boundary
        expect(isValidAU_NZCoords({ lat: -40.0, lon: 166.4 })).toBe(true);
      });
    });

    describe('Invalid coordinates', () => {
      it('should return false for coordinates outside AU/NZ', () => {
        expect(isValidAU_NZCoords({ lat: 0, lon: 0 })).toBe(false); // Equator/Prime Meridian
        expect(isValidAU_NZCoords({ lat: 35.6762, lon: 139.6503 })).toBe(false); // Tokyo
        expect(isValidAU_NZCoords({ lat: 51.5074, lon: -0.1278 })).toBe(false); // London
        expect(isValidAU_NZCoords({ lat: 40.7128, lon: -74.006 })).toBe(false); // New York
      });

      it('should return false for coordinates just outside boundaries', () => {
        // Just north of Australia
        expect(isValidAU_NZCoords({ lat: -10.6, lon: 133.0 })).toBe(false);
        // Just south of Australia
        expect(isValidAU_NZCoords({ lat: -43.7, lon: 133.0 })).toBe(false);
        // Just east of Australia
        expect(isValidAU_NZCoords({ lat: -25.0, lon: 153.7 })).toBe(false);
        // Just west of Australia
        expect(isValidAU_NZCoords({ lat: -25.0, lon: 113.2 })).toBe(false);
      });
    });
  });

  describe('buildUrl', () => {
    const validCoords: Coords = { lat: -36.8509, lon: 174.7645 }; // Auckland

    describe('hourly granularity', () => {
      it('should build URL with default hourly variables', () => {
        const url = buildUrl(validCoords, 'hourly');
        const urlObj = new URL(url);
        expect(urlObj.origin).toBe('https://api.open-meteo.com');
        expect(urlObj.pathname).toBe('/v1/forecast');
        expect(urlObj.searchParams.get('latitude')).toBe('-36.8509');
        expect(urlObj.searchParams.get('longitude')).toBe('174.7645');
        expect(urlObj.searchParams.get('hourly')).toBe(
          'temperature_2m,precipitation,windspeed_10m'
        );
        expect(urlObj.searchParams.get('timezone')).toBe('auto');
      });

      it('should build URL with custom hourly variables', () => {
        const url = buildUrl(validCoords, 'hourly', {
          vars: ['temperature_2m', 'relativehumidity_2m'],
        });
        const urlObj = new URL(url);
        expect(urlObj.searchParams.get('hourly')).toBe(
          'temperature_2m,relativehumidity_2m'
        );
      });

      it('should include start_date when provided', () => {
        const url = buildUrl(validCoords, 'hourly', {
          start: '2025-01-01',
        });
        expect(url).toContain('start_date=2025-01-01');
      });

      it('should include end_date when provided', () => {
        const url = buildUrl(validCoords, 'hourly', {
          end: '2025-01-07',
        });
        expect(url).toContain('end_date=2025-01-07');
      });

      it('should include both start_date and end_date when provided', () => {
        const url = buildUrl(validCoords, 'hourly', {
          start: '2025-01-01',
          end: '2025-01-07',
        });
        expect(url).toContain('start_date=2025-01-01');
        expect(url).toContain('end_date=2025-01-07');
      });

      it('should use custom timezone when provided', () => {
        const url = buildUrl(validCoords, 'hourly', {
          tz: 'Pacific/Auckland',
        });
        const urlObj = new URL(url);
        expect(urlObj.searchParams.get('timezone')).toBe('Pacific/Auckland');
      });
    });

    describe('daily granularity', () => {
      it('should build URL with default daily variables', () => {
        const url = buildUrl(validCoords, 'daily');
        const urlObj = new URL(url);
        expect(urlObj.origin).toBe('https://api.open-meteo.com');
        expect(urlObj.pathname).toBe('/v1/forecast');
        expect(urlObj.searchParams.get('latitude')).toBe('-36.8509');
        expect(urlObj.searchParams.get('longitude')).toBe('174.7645');
        expect(urlObj.searchParams.get('daily')).toBe(
          'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max'
        );
        expect(urlObj.searchParams.get('timezone')).toBe('auto');
      });

      it('should build URL with custom daily variables', () => {
        const url = buildUrl(validCoords, 'daily', {
          vars: ['temperature_2m_max', 'sunrise'],
        });
        const urlObj = new URL(url);
        expect(urlObj.searchParams.get('daily')).toBe(
          'temperature_2m_max,sunrise'
        );
      });

      it('should include start_date when provided', () => {
        const url = buildUrl(validCoords, 'daily', {
          start: '2025-01-01',
        });
        expect(url).toContain('start_date=2025-01-01');
      });

      it('should include end_date when provided', () => {
        const url = buildUrl(validCoords, 'daily', {
          end: '2025-01-07',
        });
        expect(url).toContain('end_date=2025-01-07');
      });
    });

    describe('coordinate validation', () => {
      it('should throw error for coordinates outside AU/NZ', () => {
        const invalidCoords: Coords = { lat: 0, lon: 0 };
        expect(() => buildUrl(invalidCoords, 'hourly')).toThrow(
          'Coordinates must be within Australia or New Zealand bounds'
        );
      });

      it('should accept valid Australian coordinates', () => {
        const auCoords: Coords = { lat: -33.8688, lon: 151.2093 }; // Sydney
        expect(() => buildUrl(auCoords, 'hourly')).not.toThrow();
      });

      it('should accept valid New Zealand coordinates', () => {
        const nzCoords: Coords = { lat: -36.8509, lon: 174.7645 }; // Auckland
        expect(() => buildUrl(nzCoords, 'hourly')).not.toThrow();
      });
    });

    describe('URL format', () => {
      it('should return a valid URL string', () => {
        const url = buildUrl(validCoords, 'hourly');
        expect(() => new URL(url)).not.toThrow();
      });

      it('should have correct base URL', () => {
        const url = buildUrl(validCoords, 'hourly');
        const urlObj = new URL(url);
        expect(urlObj.origin).toBe('https://api.open-meteo.com');
        expect(urlObj.pathname).toBe('/v1/forecast');
      });

      it('should properly encode URL parameters', () => {
        const url = buildUrl(validCoords, 'hourly', {
          vars: ['temperature_2m', 'relative humidity'],
        });
        const urlObj = new URL(url);
        // URL encoding converts spaces to + in query parameters
        expect(urlObj.searchParams.get('hourly')).toBe(
          'temperature_2m,relative humidity'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty vars array', () => {
        const url = buildUrl(validCoords, 'hourly', { vars: [] });
        expect(url).toContain('hourly=');
      });

      it('should handle undefined params', () => {
        const url = buildUrl(validCoords, 'hourly', {});
        const urlObj = new URL(url);
        expect(url).toBeDefined();
        expect(urlObj.searchParams.get('hourly')).toBe(
          'temperature_2m,precipitation,windspeed_10m'
        );
      });

      it('should not include start_date when not provided', () => {
        const url = buildUrl(validCoords, 'hourly');
        expect(url).not.toContain('start_date=');
      });

      it('should not include end_date when not provided', () => {
        const url = buildUrl(validCoords, 'hourly');
        expect(url).not.toContain('end_date=');
      });
    });
  });
});
