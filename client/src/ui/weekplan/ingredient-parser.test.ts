/**
 * Tests for ingredient parser functions with fraction support
 */

import { adjustQuantityByFactor, parseQuantity } from './ingredient-parser';

describe('adjustQuantityByFactor', () => {
  describe('Unicode fractions', () => {
    it('should adjust simple fractions', () => {
      expect(adjustQuantityByFactor('½ TL', 2)).toBe('1 TL');
      expect(adjustQuantityByFactor('¼ kg', 4)).toBe('1 kg');
      expect(adjustQuantityByFactor('¾ l', 2)).toBe('1,5 l');
    });

    it('should adjust mixed numbers', () => {
      expect(adjustQuantityByFactor('1½ kg', 2)).toBe('3 kg');
      expect(adjustQuantityByFactor('2¼ l', 2)).toBe('4,5 l');
      expect(adjustQuantityByFactor('1½ kg', 0.5)).toBe('0,75 kg');
    });

    it('should handle thirds', () => {
      // Note: 0.333 * 3 = 0.999, but trailing zeros are removed, so it becomes "1"
      expect(adjustQuantityByFactor('⅓ Tasse', 3)).toBe('1 Tasse');
      // 0.667 * 1.5 = 1.0005, trailing zeros removed = "1"
      expect(adjustQuantityByFactor('⅔ l', 1.5)).toBe('1 l');
    });
  });

  describe('Regular numbers', () => {
    it('should adjust whole numbers', () => {
      expect(adjustQuantityByFactor('500 g', 2)).toBe('1000 g');
      expect(adjustQuantityByFactor('2 kg', 1.5)).toBe('3 kg');
    });

    it('should adjust decimal numbers', () => {
      expect(adjustQuantityByFactor('1.5 l', 2)).toBe('3 l');
      expect(adjustQuantityByFactor('2,5 ml', 3)).toBe('7,5 ml');
    });
  });

  describe('Edge cases', () => {
    it('should return original for invalid factor', () => {
      expect(adjustQuantityByFactor('½ TL', 0)).toBe('½ TL');
      expect(adjustQuantityByFactor('½ TL', -1)).toBe('½ TL');
      expect(adjustQuantityByFactor('½ TL', NaN)).toBe('½ TL');
    });

    it('should handle quantities without units', () => {
      expect(adjustQuantityByFactor('½', 2)).toBe('1');
      expect(adjustQuantityByFactor('2', 1.5)).toBe('3');
    });
  });

  describe('ca. prefix removal', () => {
    it('should remove ca. prefix before adjusting', () => {
      expect(adjustQuantityByFactor('ca. 150 g', 2)).toBe('300 g');
      expect(adjustQuantityByFactor('ca. 2 kg', 1.5)).toBe('3 kg');
      expect(adjustQuantityByFactor('ca. 500 ml', 0.5)).toBe('250 ml');
    });

    it('should handle case-insensitive ca. prefix', () => {
      expect(adjustQuantityByFactor('Ca. 150 g', 2)).toBe('300 g');
      expect(adjustQuantityByFactor('CA. 2 kg', 1.5)).toBe('3 kg');
    });

    it('should handle ca. prefix with fractions', () => {
      expect(adjustQuantityByFactor('ca. ½ TL', 2)).toBe('1 TL');
      expect(adjustQuantityByFactor('ca. 1½ kg', 2)).toBe('3 kg');
    });
  });
});

describe('parseQuantity', () => {
  describe('Unicode fractions', () => {
    it('should parse simple fractions', () => {
      expect(parseQuantity('½')).toBe(0.5);
      expect(parseQuantity('¼')).toBe(0.25);
      expect(parseQuantity('¾')).toBe(0.75);
    });

    it('should parse mixed numbers', () => {
      expect(parseQuantity('1½')).toBe(1.5);
      expect(parseQuantity('2¼')).toBe(2.25);
      expect(parseQuantity('3¾')).toBe(3.75);
    });

    it('should parse thirds', () => {
      expect(parseQuantity('⅓')).toBe(0.333);
      expect(parseQuantity('⅔')).toBe(0.667);
    });
  });

  describe('Slash fractions', () => {
    it('should parse slash fractions', () => {
      expect(parseQuantity('1/2')).toBe(0.5);
      expect(parseQuantity('3/4')).toBe(0.75);
      expect(parseQuantity('2/3')).toBeCloseTo(0.667, 2);
    });
  });

  describe('Decimal numbers', () => {
    it('should parse decimal numbers', () => {
      expect(parseQuantity('1.5')).toBe(1.5);
      expect(parseQuantity('2,5')).toBe(2.5);
      expect(parseQuantity('500')).toBe(500);
    });
  });

  describe('Edge cases', () => {
    it('should return null for invalid input', () => {
      expect(parseQuantity('')).toBe(null);
      expect(parseQuantity('abc')).toBe(null);
    });
  });
});
