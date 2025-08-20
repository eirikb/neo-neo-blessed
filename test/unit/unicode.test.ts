import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as unicode from '../../lib/unicode.js';

describe('unicode module', () => {
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = {
      BLESSED_TAB_WIDTH: process.env['BLESSED_TAB_WIDTH'],
      NCURSES_CJK_WIDTH: process.env['NCURSES_CJK_WIDTH'],
    };
  });

  afterEach(() => {
    if (originalEnv.BLESSED_TAB_WIDTH !== undefined) {
      process.env['BLESSED_TAB_WIDTH'] = originalEnv.BLESSED_TAB_WIDTH;
    } else {
      delete process.env['BLESSED_TAB_WIDTH'];
    }
    if (originalEnv.NCURSES_CJK_WIDTH !== undefined) {
      process.env['NCURSES_CJK_WIDTH'] = originalEnv.NCURSES_CJK_WIDTH;
    } else {
      delete process.env['NCURSES_CJK_WIDTH'];
    }
  });

  describe('charWidth', () => {
    it('should return 0 for null character', () => {
      expect(unicode.charWidth('\0')).toBe(0);
      expect(unicode.charWidth(0)).toBe(0);
    });

    it('should return tab width for tab character', () => {
      expect(unicode.charWidth('\t')).toBe(8);
      expect(unicode.charWidth(0x09)).toBe(8);

      process.env['BLESSED_TAB_WIDTH'] = '4';
      expect(unicode.charWidth('\t')).toBe(4);

      process.env['BLESSED_TAB_WIDTH'] = '2';
      expect(unicode.charWidth('\t')).toBe(2);
    });

    it('should return 0 for control characters', () => {
      expect(unicode.charWidth('\x01')).toBe(0);
      expect(unicode.charWidth('\x1f')).toBe(0);
      expect(unicode.charWidth('\x7f')).toBe(0);
      expect(unicode.charWidth('\x9f')).toBe(0);
    });

    it('should return 1 for regular ASCII characters', () => {
      expect(unicode.charWidth('A')).toBe(1);
      expect(unicode.charWidth('z')).toBe(1);
      expect(unicode.charWidth('1')).toBe(1);
      expect(unicode.charWidth(' ')).toBe(1);
      expect(unicode.charWidth('!')).toBe(1);
    });

    it('should return 2 for wide characters', () => {
      expect(unicode.charWidth('你')).toBe(2);
      expect(unicode.charWidth('こ')).toBe(2);
      expect(unicode.charWidth('한')).toBe(2);
      expect(unicode.charWidth('😀')).toBe(1);
    });

    it('should handle string with index parameter', () => {
      const str = 'hello';
      expect(unicode.charWidth(str, 0)).toBe(1);
      expect(unicode.charWidth(str, 1)).toBe(1);
      expect(unicode.charWidth(str, 4)).toBe(1);
    });
  });

  describe('strWidth', () => {
    it('should calculate width of ASCII strings', () => {
      expect(unicode.strWidth('')).toBe(0);
      expect(unicode.strWidth('hello')).toBe(5);
      expect(unicode.strWidth('Hello World!')).toBe(12);
    });

    it('should calculate width of strings with wide characters', () => {
      expect(unicode.strWidth('你好')).toBe(4);
      expect(unicode.strWidth('Hello 你好')).toBe(10);
      expect(unicode.strWidth('😀😁')).toBe(2);
    });

    it('should handle mixed content', () => {
      expect(unicode.strWidth('A你B')).toBe(4);
      expect(unicode.strWidth('😀A')).toBe(2);
    });

    it('should handle tabs', () => {
      expect(unicode.strWidth('A\tB')).toBe(10);

      process.env['BLESSED_TAB_WIDTH'] = '4';
      expect(unicode.strWidth('A\tB')).toBe(6);
    });

    it('should handle control characters', () => {
      expect(unicode.strWidth('A\x01B')).toBe(2);
      expect(unicode.strWidth('A\0B')).toBe(2);
    });
  });

  describe('isSurrogate', () => {
    it('should identify surrogate pairs', () => {
      expect(unicode.isSurrogate('😀')).toBe(true); // Emoji uses surrogate pairs
      expect(unicode.isSurrogate('A')).toBe(false); // ASCII doesn't
      expect(unicode.isSurrogate('你')).toBe(false); // BMP characters don't
    });

    it('should handle code points directly', () => {
      expect(unicode.isSurrogate(0x1f600)).toBe(true); // 😀 emoji code point
      expect(unicode.isSurrogate(0x41)).toBe(false); // 'A' code point
      expect(unicode.isSurrogate(0x4f60)).toBe(false); // '你' code point
    });

    it('should handle string with index', () => {
      const str = 'A😀B';
      expect(unicode.isSurrogate(str, 0)).toBe(false); // 'A'
      expect(unicode.isSurrogate(str, 1)).toBe(true); // '😀'
      // Note: surrogate pairs take 2 positions in JS strings
    });
  });

  describe('codePointAt', () => {
    it('should get code points for ASCII characters', () => {
      expect(unicode.codePointAt('A')).toBe(65);
      expect(unicode.codePointAt('a')).toBe(97);
      expect(unicode.codePointAt('1')).toBe(49);
    });

    it('should get code points for Unicode characters', () => {
      expect(unicode.codePointAt('你')).toBe(0x4f60);
      expect(unicode.codePointAt('😀')).toBe(0x1f600);
    });

    it('should handle position parameter', () => {
      const str = 'ABC';
      expect(unicode.codePointAt(str, 0)).toBe(65); // 'A'
      expect(unicode.codePointAt(str, 1)).toBe(66); // 'B'
      expect(unicode.codePointAt(str, 2)).toBe(67); // 'C'
    });

    it('should handle out-of-bounds indices', () => {
      expect(unicode.codePointAt('ABC', -1)).toBe(0);
      expect(unicode.codePointAt('ABC', 10)).toBe(0);
    });

    it('should handle surrogate pairs correctly', () => {
      const str = 'A😀B';
      expect(unicode.codePointAt(str, 0)).toBe(65); // 'A'
      expect(unicode.codePointAt(str, 1)).toBe(0x1f600); // '😀'
    });
  });

  describe('fromCodePoint', () => {
    it('should create strings from ASCII code points', () => {
      expect(unicode.fromCodePoint(65)).toBe('A');
      expect(unicode.fromCodePoint(97)).toBe('a');
      expect(unicode.fromCodePoint(48)).toBe('0');
    });

    it('should create strings from Unicode code points', () => {
      expect(unicode.fromCodePoint(0x4f60)).toBe('你');
      expect(unicode.fromCodePoint(0x1f600)).toBe('😀');
    });

    it('should handle multiple code points', () => {
      expect(unicode.fromCodePoint(65, 66, 67)).toBe('ABC');
      expect(unicode.fromCodePoint(0x4f60, 0x597d)).toBe('你好');
    });

    it('should handle surrogate pairs', () => {
      expect(unicode.fromCodePoint(0x1f600, 0x1f601)).toBe('😀😁');
    });
  });
});
