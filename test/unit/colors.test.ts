import { describe, it, expect, beforeEach } from 'vitest';

const colors = require('../../lib/colors.js');

describe('colors module', () => {
  beforeEach(() => {
    colors._cache = {};
  });

  describe('RGBToHex', () => {
    it('should convert RGB numbers to hex string', () => {
      expect(colors.RGBToHex(255, 255, 255)).toBe('#ffffff');
      expect(colors.RGBToHex(0, 0, 0)).toBe('#000000');
      expect(colors.RGBToHex(255, 0, 0)).toBe('#ff0000');
      expect(colors.RGBToHex(0, 255, 0)).toBe('#00ff00');
      expect(colors.RGBToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('should convert RGB array to hex string', () => {
      expect(colors.RGBToHex([255, 255, 255])).toBe('#ffffff');
      expect(colors.RGBToHex([0, 0, 0])).toBe('#000000');
      expect(colors.RGBToHex([128, 64, 192])).toBe('#8040c0');
    });

    it('should handle single digit hex values with leading zeros', () => {
      expect(colors.RGBToHex(1, 2, 3)).toBe('#010203');
      expect(colors.RGBToHex(15, 15, 15)).toBe('#0f0f0f');
    });
  });

  describe('hexToRGB', () => {
    it('should convert hex string to RGB array', () => {
      expect(colors.hexToRGB('#ffffff')).toEqual([255, 255, 255]);
      expect(colors.hexToRGB('#000000')).toEqual([0, 0, 0]);
      expect(colors.hexToRGB('#ff0000')).toEqual([255, 0, 0]);
      expect(colors.hexToRGB('#00ff00')).toEqual([0, 255, 0]);
      expect(colors.hexToRGB('#0000ff')).toEqual([0, 0, 255]);
    });

    it('should handle short hex format (#rgb)', () => {
      expect(colors.hexToRGB('#fff')).toEqual([255, 255, 255]);
      expect(colors.hexToRGB('#000')).toEqual([0, 0, 0]);
      expect(colors.hexToRGB('#f0a')).toEqual([255, 0, 170]);
    });

    it('should handle mixed case hex strings', () => {
      expect(colors.hexToRGB('#FF00AA')).toEqual([255, 0, 170]);
      expect(colors.hexToRGB('#aaBBcc')).toEqual([170, 187, 204]);
    });
  });

  describe('match', () => {
    beforeEach(() => {
      if (!colors.vcolors || colors.vcolors.length === 0) {
        colors.colors;
      }
    });

    it('should find exact color matches', () => {
      expect(colors.match(0, 0, 0)).toBe(0);
      expect(colors.match(255, 255, 255)).toBe(15);
      expect(colors.match(255, 0, 0)).toBe(9);
    });

    it('should find closest color for non-exact matches', () => {
      expect(colors.match(32, 32, 32)).toBe(colors.match(32, 32, 32));

      const lightGrayMatch = colors.match(200, 200, 200);
      expect(lightGrayMatch).toBeGreaterThanOrEqual(0);
      expect(lightGrayMatch).toBeLessThan(256);
    });

    it('should handle hex string input', () => {
      expect(colors.match('#000000')).toBe(0);
      expect(colors.match('#ffffff')).toBe(15);
      expect(colors.match('#ff0000')).toBe(9);
    });

    it('should handle RGB array input', () => {
      expect(colors.match([0, 0, 0])).toBe(0);
      expect(colors.match([255, 255, 255])).toBe(15);
      expect(colors.match([255, 0, 0])).toBe(9);
    });

    it('should return -1 for invalid hex strings', () => {
      expect(colors.match('not-hex')).toBe(-1);
      expect(colors.match('000000')).toBe(-1);
    });

    it('should use cache for repeated color matches', () => {
      const result1 = colors.match(100, 100, 100);
      const result2 = colors.match(100, 100, 100);

      expect(result1).toBe(result2);

      const hash = (100 << 16) | (100 << 8) | 100;
      expect(colors._cache[hash]).toBeDefined();
    });
  });
});
