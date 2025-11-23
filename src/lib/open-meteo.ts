export type Coords = { lat: number; lon: number };
export type Granularity = 'hourly' | 'daily';

const BASE = 'https://api.open-meteo.com/v1/forecast';

export interface BuildUrlParams {
  start?: string;
  end?: string;
  tz?: string;
  vars?: string[];
}

/**
 * Validates that coordinates are within Australia and New Zealand bounds
 */
export function isValidAU_NZCoords({ lat, lon }: Coords): boolean {
  // Australia bounds: lat -43.6 to -10.7, lon 113.3 to 153.6
  // New Zealand bounds: lat -47.3 to -34.4, lon 166.4 to 178.6
  const isAustralia =
    lat >= -43.6 && lat <= -10.7 && lon >= 113.3 && lon <= 153.6;
  const isNewZealand =
    lat >= -47.3 && lat <= -34.4 && lon >= 166.4 && lon <= 178.6;

  return isAustralia || isNewZealand;
}

/**
 * Builds Open-Meteo API URL with the specified parameters
 */
export function buildUrl(
  { lat, lon }: Coords,
  granularity: Granularity,
  params: BuildUrlParams = {}
): string {
  // Validate coordinates are within AU/NZ bounds
  if (!isValidAU_NZCoords({ lat, lon })) {
    throw new Error(
      'Coordinates must be within Australia or New Zealand bounds'
    );
  }

  const url = new URL(BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('timezone', params.tz ?? 'auto');

  if (granularity === 'hourly') {
    url.searchParams.set(
      'hourly',
      (
        params.vars ?? ['temperature_2m', 'precipitation', 'windspeed_10m']
      ).join(',')
    );
  }

  if (granularity === 'daily') {
    url.searchParams.set(
      'daily',
      (
        params.vars ?? [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'windspeed_10m_max',
        ]
      ).join(',')
    );
  }

  if (params.start) url.searchParams.set('start_date', params.start);
  if (params.end) url.searchParams.set('end_date', params.end);

  return url.toString();
}
