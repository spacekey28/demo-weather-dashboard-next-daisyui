import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { DailyResp, HourlyResp } from './schema';

/** Merge classes with tailwind-merge with clsx full feature */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transforms hourly weather data into chart-friendly format
 * @param hourly - Hourly weather response data
 * @param key - The weather variable key to extract (e.g., 'temperature_2m', 'precipitation')
 * @returns Array of objects with time and the specified variable value
 */
export function toSeries(
  hourly: HourlyResp,
  key: string
): Array<{ time: string } & Record<string, number>> {
  return hourly.hourly.time.map((t, i) => {
    const value =
      (hourly.hourly[key as keyof typeof hourly.hourly] as number[])?.[i] ?? 0;
    return {
      time: t,
      [key]: value,
    } as { time: string } & Record<string, number>;
  });
}

/**
 * Calculates the number of rainy days in the current month
 * @param daily - Daily weather response data
 * @returns Number of days with precipitation > 0 in the current month
 */
export function rainyDaysThisMonth(daily: DailyResp): number {
  const month = new Date().toISOString().slice(0, 7);
  const precipitationSum = (daily.daily as Record<string, number[]>)
    .precipitation_sum;
  return daily.daily.time.reduce(
    (acc, t, i) =>
      acc + (t.startsWith(month) && (precipitationSum?.[i] ?? 0) > 0 ? 1 : 0),
    0
  );
}

/**
 * Alert thresholds for extreme weather conditions
 */
export const ALERT_THRESHOLDS = {
  TEMPERATURE_HIGH: 35, // °C
  PRECIPITATION_HIGH: 50, // mm/day
  WIND_SPEED_HIGH: 25, // km/h
} as const;

export type AlertType = 'temperature' | 'precipitation' | 'wind';

export interface WeatherAlert {
  type: AlertType;
  severity: 'warning' | 'danger';
  message: string;
  value: number;
  threshold: number;
}

/**
 * Detects weather alerts based on temperature threshold
 * @param temperature - Temperature value in °C
 * @returns Alert object if threshold exceeded, null otherwise
 */
export function detectTemperatureAlert(
  temperature: number
): WeatherAlert | null {
  if (temperature > ALERT_THRESHOLDS.TEMPERATURE_HIGH) {
    return {
      type: 'temperature',
      severity: 'danger',
      message: `Extreme temperature: ${temperature.toFixed(1)}°C`,
      value: temperature,
      threshold: ALERT_THRESHOLDS.TEMPERATURE_HIGH,
    };
  }
  return null;
}

/**
 * Detects weather alerts based on precipitation threshold
 * @param precipitation - Precipitation value in mm/day
 * @returns Alert object if threshold exceeded, null otherwise
 */
export function detectPrecipitationAlert(
  precipitation: number
): WeatherAlert | null {
  if (precipitation > ALERT_THRESHOLDS.PRECIPITATION_HIGH) {
    return {
      type: 'precipitation',
      severity: 'danger',
      message: `Heavy precipitation: ${precipitation.toFixed(1)}mm/day`,
      value: precipitation,
      threshold: ALERT_THRESHOLDS.PRECIPITATION_HIGH,
    };
  }
  return null;
}

/**
 * Detects weather alerts based on wind speed threshold
 * @param windSpeed - Wind speed value in km/h
 * @returns Alert object if threshold exceeded, null otherwise
 */
export function detectWindAlert(windSpeed: number): WeatherAlert | null {
  if (windSpeed > ALERT_THRESHOLDS.WIND_SPEED_HIGH) {
    return {
      type: 'wind',
      severity: 'warning',
      message: `Strong winds: ${windSpeed.toFixed(1)}km/h`,
      value: windSpeed,
      threshold: ALERT_THRESHOLDS.WIND_SPEED_HIGH,
    };
  }
  return null;
}

/**
 * Detects all weather alerts from daily data
 * @param daily - Daily weather response data
 * @returns Array of alert objects
 */
export function detectAllAlerts(daily: DailyResp): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const dailyData = daily.daily as Record<string, number[]>;

  daily.daily.time.forEach((_, i) => {
    const tempMax = dailyData.temperature_2m_max?.[i];
    const precipitation = dailyData.precipitation_sum?.[i];
    const windSpeed = dailyData.windspeed_10m_max?.[i];

    if (tempMax !== undefined) {
      const alert = detectTemperatureAlert(tempMax);
      if (alert) alerts.push(alert);
    }

    if (precipitation !== undefined) {
      const alert = detectPrecipitationAlert(precipitation);
      if (alert) alerts.push(alert);
    }

    if (windSpeed !== undefined) {
      const alert = detectWindAlert(windSpeed);
      if (alert) alerts.push(alert);
    }
  });

  return alerts;
}

/**
 * Formats a date string for display in charts and UI
 * @param dateString - ISO date string (e.g., '2025-01-21' or '2025-01-21T12:00')
 * @param format - Format type: 'short' (MM/DD), 'medium' (Mon DD), 'long' (Month DD, YYYY), 'time' (HH:MM)
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  format: 'short' | 'medium' | 'long' | 'time' = 'medium'
): string {
  const date = new Date(dateString);

  if (format === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    });
  }

  if (format === 'medium') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // long format
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
