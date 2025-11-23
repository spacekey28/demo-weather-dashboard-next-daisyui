export interface Location {
  label: string;
  lat: number;
  lon: number;
}

export const PRESETS: Record<string, Location> = {
  auckland: {
    label: 'Auckland, NZ',
    lat: -36.8509,
    lon: 174.7645,
  },
  sydney: {
    label: 'Sydney, AU',
    lat: -33.8688,
    lon: 151.2093,
  },
  melbourne: {
    label: 'Melbourne, AU',
    lat: -37.8136,
    lon: 144.9631,
  },
  brisbane: {
    label: 'Brisbane, AU',
    lat: -27.4698,
    lon: 153.0251,
  },
  wellington: {
    label: 'Wellington, NZ',
    lat: -41.2865,
    lon: 174.7762,
  },
};

export function getLocationById(id: string): Location | undefined {
  return PRESETS[id];
}

export function getAllLocationIds(): string[] {
  return Object.keys(PRESETS);
}

export function isValidLocationId(id: string): boolean {
  return id in PRESETS;
}
