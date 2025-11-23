import type { DailyResp, HourlyResp } from './schema';
import {
  ALERT_THRESHOLDS,
  detectAllAlerts,
  detectPrecipitationAlert,
  detectTemperatureAlert,
  detectWindAlert,
  formatDate,
  rainyDaysThisMonth,
  toSeries,
} from './utils';

describe('utils', () => {
  describe('toSeries', () => {
    it('should transform hourly data into chart-friendly format', () => {
      const hourly: HourlyResp = {
        hourly: {
          time: ['2025-01-21T00:00', '2025-01-21T01:00', '2025-01-21T02:00'],
          temperature_2m: [20.5, 19.8, 19.2],
        },
      };

      const result = toSeries(hourly, 'temperature_2m');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        time: '2025-01-21T00:00',
        temperature_2m: 20.5,
      });
      expect(result[1]).toEqual({
        time: '2025-01-21T01:00',
        temperature_2m: 19.8,
      });
    });

    it('should handle missing values with default 0', () => {
      const hourly: HourlyResp = {
        hourly: {
          time: ['2025-01-21T00:00', '2025-01-21T01:00'],
          temperature_2m: [20.5, undefined as unknown as number],
        },
      };

      const result = toSeries(hourly, 'temperature_2m');
      expect(result[0].temperature_2m).toBe(20.5);
      expect(result[1].temperature_2m).toBe(0);
    });

    it('should handle non-existent keys', () => {
      const hourly: HourlyResp = {
        hourly: {
          time: ['2025-01-21T00:00'],
          temperature_2m: [20.5],
        },
      };

      const result = toSeries(hourly, 'nonexistent_key');
      expect(result[0].nonexistent_key).toBe(0);
    });

    it('should handle empty time array', () => {
      const hourly: HourlyResp = {
        hourly: {
          time: [],
          temperature_2m: [],
        },
      };

      const result = toSeries(hourly, 'temperature_2m');
      expect(result).toHaveLength(0);
    });

    it('should work with different variable keys', () => {
      const hourly: HourlyResp = {
        hourly: {
          time: ['2025-01-21T00:00'],
          precipitation: [5.2],
        },
      };

      const result = toSeries(hourly, 'precipitation');
      expect(result[0].precipitation).toBe(5.2);
    });
  });

  describe('rainyDaysThisMonth', () => {
    it('should count rainy days in current month', () => {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const daily: DailyResp = {
        daily: {
          time: [
            `${currentMonth}-01`,
            `${currentMonth}-02`,
            `${currentMonth}-03`,
          ],
          precipitation_sum: [0, 5.5, 12.3],
        },
      };

      const result = rainyDaysThisMonth(daily);
      expect(result).toBe(2); // Days 2 and 3 have precipitation > 0
    });

    it('should return 0 when no rainy days in current month', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const daily: DailyResp = {
        daily: {
          time: [`${currentMonth}-01`, `${currentMonth}-02`],
          precipitation_sum: [0, 0],
        },
      };

      const result = rainyDaysThisMonth(daily);
      expect(result).toBe(0);
    });

    it('should ignore days from other months', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      // Use a date from a different month (previous month to avoid year boundary issues)
      const previousMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1
      )
        .toISOString()
        .slice(0, 7);

      const daily: DailyResp = {
        daily: {
          time: [`${currentMonth}-01`, `${previousMonth}-15`],
          precipitation_sum: [0, 10.5],
        },
      };

      const result = rainyDaysThisMonth(daily);
      expect(result).toBe(0); // Previous month's rainy day shouldn't count
    });

    it('should handle missing precipitation values', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const daily: DailyResp = {
        daily: {
          time: [`${currentMonth}-01`],
          precipitation_sum: [undefined as unknown as number],
        },
      };

      const result = rainyDaysThisMonth(daily);
      expect(result).toBe(0);
    });

    it('should handle empty time array', () => {
      const daily: DailyResp = {
        daily: {
          time: [],
          precipitation_sum: [],
        },
      };

      const result = rainyDaysThisMonth(daily);
      expect(result).toBe(0);
    });
  });

  describe('detectTemperatureAlert', () => {
    it('should return alert when temperature exceeds threshold', () => {
      const alert = detectTemperatureAlert(36);
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('temperature');
      expect(alert?.severity).toBe('danger');
      expect(alert?.value).toBe(36);
      expect(alert?.threshold).toBe(ALERT_THRESHOLDS.TEMPERATURE_HIGH);
      expect(alert?.message).toContain('36.0°C');
    });

    it('should return null when temperature is below threshold', () => {
      const alert = detectTemperatureAlert(34);
      expect(alert).toBeNull();
    });

    it('should return null when temperature equals threshold', () => {
      const alert = detectTemperatureAlert(35);
      expect(alert).toBeNull();
    });

    it('should handle very high temperatures', () => {
      const alert = detectTemperatureAlert(45);
      expect(alert).not.toBeNull();
      expect(alert?.value).toBe(45);
    });
  });

  describe('detectPrecipitationAlert', () => {
    it('should return alert when precipitation exceeds threshold', () => {
      const alert = detectPrecipitationAlert(55);
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('precipitation');
      expect(alert?.severity).toBe('danger');
      expect(alert?.value).toBe(55);
      expect(alert?.threshold).toBe(ALERT_THRESHOLDS.PRECIPITATION_HIGH);
      expect(alert?.message).toContain('55.0mm/day');
    });

    it('should return null when precipitation is below threshold', () => {
      const alert = detectPrecipitationAlert(45);
      expect(alert).toBeNull();
    });

    it('should return null when precipitation equals threshold', () => {
      const alert = detectPrecipitationAlert(50);
      expect(alert).toBeNull();
    });

    it('should handle zero precipitation', () => {
      const alert = detectPrecipitationAlert(0);
      expect(alert).toBeNull();
    });
  });

  describe('detectWindAlert', () => {
    it('should return alert when wind speed exceeds threshold', () => {
      const alert = detectWindAlert(30);
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('wind');
      expect(alert?.severity).toBe('warning');
      expect(alert?.value).toBe(30);
      expect(alert?.threshold).toBe(ALERT_THRESHOLDS.WIND_SPEED_HIGH);
      expect(alert?.message).toContain('30.0km/h');
    });

    it('should return null when wind speed is below threshold', () => {
      const alert = detectWindAlert(20);
      expect(alert).toBeNull();
    });

    it('should return null when wind speed equals threshold', () => {
      const alert = detectWindAlert(25);
      expect(alert).toBeNull();
    });

    it('should handle very high wind speeds', () => {
      const alert = detectWindAlert(50);
      expect(alert).not.toBeNull();
      expect(alert?.value).toBe(50);
    });
  });

  describe('detectAllAlerts', () => {
    it('should detect all types of alerts', () => {
      const daily: DailyResp = {
        daily: {
          time: ['2025-01-21', '2025-01-22'],
          temperature_2m_max: [36, 34],
          precipitation_sum: [55, 30],
          windspeed_10m_max: [30, 20],
        },
      };

      const alerts = detectAllAlerts(daily);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some((a) => a.type === 'temperature')).toBe(true);
      expect(alerts.some((a) => a.type === 'precipitation')).toBe(true);
      expect(alerts.some((a) => a.type === 'wind')).toBe(true);
    });

    it('should return empty array when no alerts', () => {
      const daily: DailyResp = {
        daily: {
          time: ['2025-01-21'],
          temperature_2m_max: [30],
          precipitation_sum: [20],
          windspeed_10m_max: [15],
        },
      };

      const alerts = detectAllAlerts(daily);
      expect(alerts).toHaveLength(0);
    });

    it('should handle missing weather variables', () => {
      const daily: DailyResp = {
        daily: {
          time: ['2025-01-21'],
          temperature_2m_max: [36],
          // precipitation_sum and windspeed_10m_max missing
        },
      };

      const alerts = detectAllAlerts(daily);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every((a) => a.type === 'temperature')).toBe(true);
    });

    it('should handle empty time array', () => {
      const daily: DailyResp = {
        daily: {
          time: [],
          temperature_2m_max: [],
          precipitation_sum: [],
          windspeed_10m_max: [],
        },
      };

      const alerts = detectAllAlerts(daily);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('formatDate', () => {
    it('should format date in short format (MM/DD)', () => {
      const formatted = formatDate('2025-01-21', 'short');
      expect(formatted).toMatch(/\d{2}\/\d{2}/);
    });

    it('should format date in medium format (Mon DD)', () => {
      const formatted = formatDate('2025-01-21', 'medium');
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/\d{1,2}/);
    });

    it('should format date in long format (Month DD, YYYY)', () => {
      const formatted = formatDate('2025-01-21', 'long');
      expect(formatted).toMatch(/January/);
      expect(formatted).toMatch(/2025/);
    });

    it('should format time from ISO string', () => {
      const formatted = formatDate('2025-01-21T14:30:00', 'time');
      expect(formatted).toMatch(/\d{2}:\d{2}/);
      expect(formatted).toContain('14:30');
    });

    it('should default to medium format', () => {
      const formatted = formatDate('2025-01-21');
      expect(formatted).toMatch(/Jan/);
    });

    it('should handle different date strings', () => {
      const date1 = formatDate('2025-12-25', 'medium');
      const date2 = formatDate('2025-06-15', 'medium');
      expect(date1).toBeDefined();
      expect(date2).toBeDefined();
      expect(date1).not.toBe(date2);
    });

    it('should handle time format with different times', () => {
      const time1 = formatDate('2025-01-21T09:00:00', 'time');
      const time2 = formatDate('2025-01-21T21:30:00', 'time');
      expect(time1).toContain('09:00');
      expect(time2).toContain('21:30');
    });
  });

  describe('ALERT_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(ALERT_THRESHOLDS.TEMPERATURE_HIGH).toBe(35);
      expect(ALERT_THRESHOLDS.PRECIPITATION_HIGH).toBe(50);
      expect(ALERT_THRESHOLDS.WIND_SPEED_HIGH).toBe(25);
    });

    it('should be readonly constants', () => {
      expect(typeof ALERT_THRESHOLDS.TEMPERATURE_HIGH).toBe('number');
      expect(typeof ALERT_THRESHOLDS.PRECIPITATION_HIGH).toBe('number');
      expect(typeof ALERT_THRESHOLDS.WIND_SPEED_HIGH).toBe('number');
    });
  });
});
