import { z } from 'zod';

/**
 * Zod schema for hourly weather data response from Open-Meteo API
 * Uses passthrough() to allow additional properties beyond the required 'time' array
 */
export const ZHourly = z.object({
  hourly: z
    .object({
      time: z.array(z.string()),
    })
    .passthrough(),
});

/**
 * Zod schema for daily weather data response from Open-Meteo API
 * Uses passthrough() to allow additional properties beyond the required 'time' array
 */
export const ZDaily = z.object({
  daily: z
    .object({
      time: z.array(z.string()),
    })
    .passthrough(),
});

/**
 * TypeScript type inferred from ZHourly schema
 */
export type HourlyResp = z.infer<typeof ZHourly>;

/**
 * TypeScript type inferred from ZDaily schema
 */
export type DailyResp = z.infer<typeof ZDaily>;
