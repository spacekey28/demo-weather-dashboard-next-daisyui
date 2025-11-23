import {
  getAllLocationIds,
  getLocationById,
  isValidLocationId,
  PRESETS,
} from './locations';

describe('locations', () => {
  describe('PRESETS', () => {
    it('should contain all expected AU/NZ cities', () => {
      const expectedCities = [
        'auckland',
        'sydney',
        'melbourne',
        'brisbane',
        'wellington',
      ];

      expectedCities.forEach((cityId) => {
        expect(PRESETS[cityId]).toBeDefined();
      });
    });

    it('should have correct structure for each location', () => {
      Object.values(PRESETS).forEach((location) => {
        expect(location).toHaveProperty('label');
        expect(location).toHaveProperty('lat');
        expect(location).toHaveProperty('lon');
        expect(typeof location.label).toBe('string');
        expect(typeof location.lat).toBe('number');
        expect(typeof location.lon).toBe('number');
      });
    });

    it('should have valid coordinates for Auckland', () => {
      const auckland = PRESETS.auckland;
      expect(auckland.label).toBe('Auckland, NZ');
      expect(auckland.lat).toBe(-36.8509);
      expect(auckland.lon).toBe(174.7645);
    });

    it('should have valid coordinates for Sydney', () => {
      const sydney = PRESETS.sydney;
      expect(sydney.label).toBe('Sydney, AU');
      expect(sydney.lat).toBe(-33.8688);
      expect(sydney.lon).toBe(151.2093);
    });

    it('should have valid coordinates for Melbourne', () => {
      const melbourne = PRESETS.melbourne;
      expect(melbourne.label).toBe('Melbourne, AU');
      expect(melbourne.lat).toBe(-37.8136);
      expect(melbourne.lon).toBe(144.9631);
    });

    it('should have valid coordinates for Brisbane', () => {
      const brisbane = PRESETS.brisbane;
      expect(brisbane.label).toBe('Brisbane, AU');
      expect(brisbane.lat).toBe(-27.4698);
      expect(brisbane.lon).toBe(153.0251);
    });

    it('should have valid coordinates for Wellington', () => {
      const wellington = PRESETS.wellington;
      expect(wellington.label).toBe('Wellington, NZ');
      expect(wellington.lat).toBe(-41.2865);
      expect(wellington.lon).toBe(174.7762);
    });

    it('should only contain AU/NZ cities', () => {
      const allIds = Object.keys(PRESETS);
      expect(allIds.length).toBe(5);
      expect(allIds).not.toContain('seoul');
      expect(allIds).not.toContain('tokyo');
    });
  });

  describe('getLocationById', () => {
    it('should return location for valid ID', () => {
      const location = getLocationById('auckland');
      expect(location).toBeDefined();
      expect(location?.label).toBe('Auckland, NZ');
    });

    it('should return undefined for invalid ID', () => {
      const location = getLocationById('invalid-city');
      expect(location).toBeUndefined();
    });

    it('should return correct location for all preset cities', () => {
      const cityIds = [
        'auckland',
        'sydney',
        'melbourne',
        'brisbane',
        'wellington',
      ];
      cityIds.forEach((id) => {
        const location = getLocationById(id);
        expect(location).toBeDefined();
        expect(location).toEqual(PRESETS[id]);
      });
    });

    it('should handle empty string', () => {
      const location = getLocationById('');
      expect(location).toBeUndefined();
    });

    it('should handle case-sensitive IDs', () => {
      const location = getLocationById('Auckland');
      expect(location).toBeUndefined();
    });
  });

  describe('getAllLocationIds', () => {
    it('should return all location IDs', () => {
      const ids = getAllLocationIds();
      expect(ids).toHaveLength(5);
      expect(ids).toContain('auckland');
      expect(ids).toContain('sydney');
      expect(ids).toContain('melbourne');
      expect(ids).toContain('brisbane');
      expect(ids).toContain('wellington');
    });

    it('should return an array', () => {
      const ids = getAllLocationIds();
      expect(Array.isArray(ids)).toBe(true);
    });

    it('should return all keys from PRESETS', () => {
      const ids = getAllLocationIds();
      const presetKeys = Object.keys(PRESETS);
      expect(ids.sort()).toEqual(presetKeys.sort());
    });
  });

  describe('isValidLocationId', () => {
    it('should return true for valid location IDs', () => {
      expect(isValidLocationId('auckland')).toBe(true);
      expect(isValidLocationId('sydney')).toBe(true);
      expect(isValidLocationId('melbourne')).toBe(true);
      expect(isValidLocationId('brisbane')).toBe(true);
      expect(isValidLocationId('wellington')).toBe(true);
    });

    it('should return false for invalid location IDs', () => {
      expect(isValidLocationId('invalid-city')).toBe(false);
      expect(isValidLocationId('tokyo')).toBe(false);
      expect(isValidLocationId('seoul')).toBe(false);
      expect(isValidLocationId('london')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidLocationId('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isValidLocationId('Auckland')).toBe(false);
      expect(isValidLocationId('SYDNEY')).toBe(false);
    });

    it('should return false for non-string values', () => {
      // TypeScript will prevent this, but testing runtime behavior
      expect(isValidLocationId('')).toBe(false);
    });
  });
});
