import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', () => ({
  readdirSync: vi.fn(),
  lstatSync: vi.fn(),
}));

const helpers = require('../../lib/helpers.js');
const fs = require('fs');

describe('helpers module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('merge', () => {
    it('should merge properties from source to target object', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = helpers.merge(target, source);

      expect(result).toBe(target); // Should return the same object
      expect(target).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should handle empty objects', () => {
      const target = {};
      const source = { a: 1 };

      helpers.merge(target, source);

      expect(target).toEqual({ a: 1 });
    });

    it('should overwrite existing properties', () => {
      const target = { name: 'old', value: 100 };
      const source = { name: 'new' };

      helpers.merge(target, source);

      expect(target).toEqual({ name: 'new', value: 100 });
    });
  });

  describe('asort', () => {
    it('should sort objects by name alphabetically', () => {
      const items = [{ name: 'zebra' }, { name: 'apple' }, { name: 'bear' }];

      const result = helpers.asort(items);

      expect(result.map(item => item.name)).toEqual(['apple', 'bear', 'zebra']);
    });

    it('should be case-insensitive', () => {
      const items = [{ name: 'Zebra' }, { name: 'apple' }, { name: 'Bear' }];

      const result = helpers.asort(items);

      expect(result.map(item => item.name)).toEqual(['apple', 'Bear', 'Zebra']);
    });

    it('should handle dotfiles correctly', () => {
      const items = [
        { name: '.zshrc' },
        { name: 'file.txt' },
        { name: '.bashrc' },
      ];

      const result = helpers.asort(items);

      expect(result.map(item => item.name)).toEqual([
        '.bashrc',
        '.zshrc',
        'file.txt',
      ]);
    });

    it('should handle empty array', () => {
      const items: { name: string }[] = [];

      const result = helpers.asort(items);

      expect(result).toEqual([]);
    });
  });

  describe('hsort', () => {
    it('should sort objects by index in descending order', () => {
      const items = [{ index: 1 }, { index: 5 }, { index: 3 }];

      const result = helpers.hsort(items);

      expect(result.map(item => item.index)).toEqual([5, 3, 1]);
    });

    it('should handle negative indices', () => {
      const items = [{ index: -1 }, { index: 5 }, { index: 0 }];

      const result = helpers.hsort(items);

      expect(result.map(item => item.index)).toEqual([5, 0, -1]);
    });

    it('should handle empty array', () => {
      const items: { index: number }[] = [];

      const result = helpers.hsort(items);

      expect(result).toEqual([]);
    });
  });

  describe('escape', () => {
    it('should escape curly braces', () => {
      expect(helpers.escape('hello {world}')).toBe('hello {open}world{close}');
      expect(helpers.escape('{red}text{/red}')).toBe(
        '{open}red{close}text{open}/red{close}'
      );
    });

    it('should handle strings without braces', () => {
      expect(helpers.escape('hello world')).toBe('hello world');
      expect(helpers.escape('')).toBe('');
    });

    it('should handle multiple braces', () => {
      expect(helpers.escape('{{{}}}')).toBe(
        '{open}{open}{open}{close}{close}{close}'
      );
    });
  });

  describe('generateTags', () => {
    it('should generate opening and closing tags for string values', () => {
      const style = { fg: 'red', bg: 'blue' };

      const result = helpers.generateTags(style) as {
        open: string;
        close: string;
      };

      expect(result.open).toContain('{red-fg}');
      expect(result.open).toContain('{blue-bg}');
      expect(result.close).toContain('{/red-fg}');
      expect(result.close).toContain('{/blue-bg}');
    });

    it('should generate tags for boolean values', () => {
      const style = { bold: true, underline: true };

      const result = helpers.generateTags(style) as {
        open: string;
        close: string;
      };

      expect(result.open).toContain('{bold}');
      expect(result.open).toContain('{underline}');
      expect(result.close).toContain('{/bold}');
      expect(result.close).toContain('{/underline}');
    });

    it('should wrap text when provided', () => {
      const style = { fg: 'red' };

      const result = helpers.generateTags(style, 'hello') as string;

      expect(result).toBe('{red-fg}hello{/red-fg}');
    });

    it('should handle light/bright color prefixes', () => {
      const style = { fg: 'lightred', bg: 'brightblue' };

      const result = helpers.generateTags(style) as {
        open: string;
        close: string;
      };

      expect(result.open).toContain('{light-red-fg}');
      expect(result.open).toContain('{bright-blue-bg}');
    });

    it('should handle null/empty style', () => {
      const result1 = helpers.generateTags(null) as {
        open: string;
        close: string;
      };
      const result2 = helpers.generateTags({}) as {
        open: string;
        close: string;
      };

      expect(result1.open).toBe('');
      expect(result1.close).toBe('');
      expect(result2.open).toBe('');
      expect(result2.close).toBe('');
    });
  });

  describe('stripTags', () => {
    it('should remove blessed tags', () => {
      expect(helpers.stripTags('{red}hello{/red}')).toBe('hello');
      expect(helpers.stripTags('{bold,underline}text{/}')).toBe('text');
    });

    it('should remove ANSI escape sequences', () => {
      expect(helpers.stripTags('\x1b[31mred text\x1b[0m')).toBe('red text');
    });

    it('should handle empty or null strings', () => {
      expect(helpers.stripTags('')).toBe('');
      expect(helpers.stripTags(null as any)).toBe('');
      expect(helpers.stripTags(undefined as any)).toBe('');
    });

    it('should handle strings without tags', () => {
      expect(helpers.stripTags('plain text')).toBe('plain text');
    });
  });

  describe('cleanTags', () => {
    it('should strip tags and trim whitespace', () => {
      expect(helpers.cleanTags('  {red}hello{/red}  ')).toBe('hello');
      expect(helpers.cleanTags('\n\t{bold}text{/bold}\n')).toBe('text');
    });
  });

  describe('findFile', () => {
    it('should skip restricted directories', () => {
      const result1 = helpers.findFile('/dev', 'target.txt');
      const result2 = helpers.findFile('/sys', 'target.txt');
      const result3 = helpers.findFile('/proc', 'target.txt');
      const result4 = helpers.findFile('/net', 'target.txt');

      expect(result1).toBe(null);
      expect(result2).toBe(null);
      expect(result3).toBe(null);
      expect(result4).toBe(null);
    });

    it('should return null for non-existent paths', () => {
      const result = helpers.findFile(
        '/definitely/does/not/exist',
        'target.txt'
      );

      expect(result).toBe(null);
    });

    it('should handle the function signature correctly', () => {
      expect(() => helpers.findFile('/tmp', 'nonexistent')).not.toThrow();
    });

    it('should return a string or null', () => {
      const result = helpers.findFile('/tmp', 'nonexistent');
      expect(typeof result === 'string' || result === null).toBe(true);
    });
  });
});
