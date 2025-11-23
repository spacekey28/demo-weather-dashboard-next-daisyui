import { type DailyResp, type HourlyResp, ZDaily, ZHourly } from './schema';

describe('schema', () => {
  describe('ZHourly', () => {
    it('should validate correct hourly response structure', () => {
      const validData = {
        hourly: {
          time: ['2025-01-21T00:00', '2025-01-21T01:00'],
          temperature_2m: [20.5, 19.8],
          precipitation: [0, 0.5],
          windspeed_10m: [15.2, 18.3],
        },
      };

      const result = ZHourly.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hourly.time).toEqual(validData.hourly.time);
        expect(result.data.hourly.temperature_2m).toEqual(
          validData.hourly.temperature_2m
        );
      }
    });

    it('should require hourly.time array', () => {
      const invalidData = {
        hourly: {
          temperature_2m: [20.5],
        },
      };

      const result = ZHourly.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require hourly object', () => {
      const invalidData = {
        time: ['2025-01-21T00:00'],
      };

      const result = ZHourly.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require time to be an array of strings', () => {
      const invalidData = {
        hourly: {
          time: [123, 456], // numbers instead of strings
        },
      };

      const result = ZHourly.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow additional properties via passthrough', () => {
      const validData = {
        hourly: {
          time: ['2025-01-21T00:00'],
          temperature_2m: [20.5],
          relativehumidity_2m: [65],
          custom_property: 'allowed',
        },
      };

      const result = ZHourly.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hourly.custom_property).toBe('allowed');
        expect(result.data.hourly.relativehumidity_2m).toEqual([65]);
      }
    });

    it('should handle empty time array', () => {
      const validData = {
        hourly: {
          time: [],
          temperature_2m: [],
        },
      };

      const result = ZHourly.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hourly.time).toEqual([]);
      }
    });

    it('should handle multiple weather variables', () => {
      const validData = {
        hourly: {
          time: ['2025-01-21T00:00', '2025-01-21T01:00'],
          temperature_2m: [20.5, 19.8],
          precipitation: [0, 0.5],
          windspeed_10m: [15.2, 18.3],
          relativehumidity_2m: [65, 70],
        },
      };

      const result = ZHourly.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hourly.temperature_2m).toEqual([20.5, 19.8]);
        expect(result.data.hourly.precipitation).toEqual([0, 0.5]);
        expect(result.data.hourly.windspeed_10m).toEqual([15.2, 18.3]);
        expect(result.data.hourly.relativehumidity_2m).toEqual([65, 70]);
      }
    });
  });

  describe('ZDaily', () => {
    it('should validate correct daily response structure', () => {
      const validData = {
        daily: {
          time: ['2025-01-21', '2025-01-22'],
          temperature_2m_max: [25.5, 26.2],
          temperature_2m_min: [18.3, 19.1],
          precipitation_sum: [0, 5.2],
          windspeed_10m_max: [20.1, 22.5],
        },
      };

      const result = ZDaily.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.daily.time).toEqual(validData.daily.time);
        expect(result.data.daily.temperature_2m_max).toEqual(
          validData.daily.temperature_2m_max
        );
      }
    });

    it('should require daily.time array', () => {
      const invalidData = {
        daily: {
          temperature_2m_max: [25.5],
        },
      };

      const result = ZDaily.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require daily object', () => {
      const invalidData = {
        time: ['2025-01-21'],
      };

      const result = ZDaily.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require time to be an array of strings', () => {
      const invalidData = {
        daily: {
          time: [123, 456], // numbers instead of strings
        },
      };

      const result = ZDaily.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow additional properties via passthrough', () => {
      const validData = {
        daily: {
          time: ['2025-01-21'],
          temperature_2m_max: [25.5],
          sunrise: ['06:00'],
          sunset: ['18:00'],
          custom_property: 'allowed',
        },
      };

      const result = ZDaily.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.daily.custom_property).toBe('allowed');
        expect(result.data.daily.sunrise).toEqual(['06:00']);
      }
    });

    it('should handle empty time array', () => {
      const validData = {
        daily: {
          time: [],
          temperature_2m_max: [],
        },
      };

      const result = ZDaily.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.daily.time).toEqual([]);
      }
    });

    it('should handle multiple weather variables', () => {
      const validData = {
        daily: {
          time: ['2025-01-21', '2025-01-22'],
          temperature_2m_max: [25.5, 26.2],
          temperature_2m_min: [18.3, 19.1],
          precipitation_sum: [0, 5.2],
          windspeed_10m_max: [20.1, 22.5],
          sunrise: ['06:00', '06:01'],
          sunset: ['18:00', '18:01'],
        },
      };

      const result = ZDaily.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.daily.temperature_2m_max).toEqual([25.5, 26.2]);
        expect(result.data.daily.precipitation_sum).toEqual([0, 5.2]);
        expect(result.data.daily.sunrise).toEqual(['06:00', '06:01']);
      }
    });
  });

  describe('Type exports', () => {
    it('should export HourlyResp type', () => {
      const data: HourlyResp = {
        hourly: {
          time: ['2025-01-21T00:00'],
          temperature_2m: [20.5],
        },
      };
      expect(data).toBeDefined();
      expect(data.hourly.time).toBeDefined();
    });

    it('should export DailyResp type', () => {
      const data: DailyResp = {
        daily: {
          time: ['2025-01-21'],
          temperature_2m_max: [25.5],
        },
      };
      expect(data).toBeDefined();
      expect(data.daily.time).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should provide error details for invalid hourly data', () => {
      const invalidData = {
        hourly: {
          time: [123], // invalid type
        },
      };

      const result = ZHourly.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toBeDefined();
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should provide error details for invalid daily data', () => {
      const invalidData = {
        daily: {
          time: [123], // invalid type
        },
      };

      const result = ZDaily.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toBeDefined();
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject null values', () => {
      const invalidData = null;
      const hourlyResult = ZHourly.safeParse(invalidData);
      const dailyResult = ZDaily.safeParse(invalidData);

      expect(hourlyResult.success).toBe(false);
      expect(dailyResult.success).toBe(false);
    });

    it('should reject undefined values', () => {
      const invalidData = undefined;
      const hourlyResult = ZHourly.safeParse(invalidData);
      const dailyResult = ZDaily.safeParse(invalidData);

      expect(hourlyResult.success).toBe(false);
      expect(dailyResult.success).toBe(false);
    });
  });
});
