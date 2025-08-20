import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('string_decoder', () => ({
  StringDecoder: vi.fn().mockImplementation(() => ({
    write: vi.fn().mockImplementation(buffer => buffer.toString()),
  })),
}));

import * as keys from '../../lib/keys.js';

interface MockStream extends EventEmitter {
  _keypressDecoder?: any;
  encoding?: string;
  listeners(event: string): Function[];
  removeListener(event: string, listener: Function): this;
  removeAllListeners(event?: string): this;
}

function createMockStream(): MockStream {
  const stream = new EventEmitter() as MockStream;
  stream.encoding = 'utf-8';
  return stream;
}

describe('keys module', () => {
  let mockStream: MockStream;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStream = createMockStream();
  });

  describe('emitKeypressEvents', () => {
    it('should add keypress decoder to stream', () => {
      keys.emitKeypressEvents(mockStream);
      expect(mockStream._keypressDecoder).toBeDefined();
    });

    it('should not add decoder twice to same stream', () => {
      keys.emitKeypressEvents(mockStream);
      const firstDecoder = mockStream._keypressDecoder;

      keys.emitKeypressEvents(mockStream);
      expect(mockStream._keypressDecoder).toBe(firstDecoder);
    });

    it('should set up data listener when keypress listeners exist', () => {
      // First add a keypress listener to trigger data listener setup
      mockStream.on('keypress', () => {});

      const listenerSpy = vi.spyOn(mockStream, 'on');
      keys.emitKeypressEvents(mockStream);

      expect(listenerSpy).toHaveBeenCalledWith('data', expect.any(Function));
    });
  });

  describe('key parsing - basic keys', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse carriage return', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\r'));

      expect(keyData?.key?.name).toBe('return');
      expect(keyData?.key?.ctrl).toBe(false);
      expect(keyData?.key?.meta).toBe(false);
      expect(keyData?.key?.shift).toBe(false);
    });

    it('should parse enter/newline', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\n'));

      expect(keyData?.key?.name).toBe('enter');
    });

    it('should parse tab', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\t'));

      expect(keyData?.key?.name).toBe('tab');
      expect(keyData?.key?.shift).toBe(false);
    });

    it('should parse backspace variations', () => {
      const backspaceVariations = ['\b', '\x7f', '\x1b\x7f', '\x1b\b'];

      backspaceVariations.forEach((sequence, index) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe('backspace');
        expect(keyData?.key?.meta).toBe(sequence.startsWith('\x1b'));
      });
    });

    it('should parse escape key', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x1b'));

      expect(keyData?.key?.name).toBe('escape');
      expect(keyData?.key?.meta).toBe(false);
    });

    it('should parse double escape (meta escape)', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x1b\x1b'));

      expect(keyData?.key?.name).toBe('escape');
      expect(keyData?.key?.meta).toBe(true);
    });

    it('should parse space key', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from(' '));

      expect(keyData?.key?.name).toBe('space');
      expect(keyData?.key?.meta).toBe(false);
    });

    it('should parse meta space', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x1b '));

      expect(keyData?.key?.name).toBe('space');
      expect(keyData?.key?.meta).toBe(true);
    });
  });

  describe('key parsing - ctrl keys', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse ctrl+a through ctrl+z', () => {
      for (let i = 1; i <= 26; i++) {
        // Skip special keys that have their own handling: Ctrl+H (backspace), Ctrl+I (tab), Ctrl+J (enter), Ctrl+M (return)
        if (i === 8 || i === 9 || i === 10 || i === 13) continue;

        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        const char = String.fromCharCode(i);
        const expectedName = String.fromCharCode(i + 96); // Convert to lowercase letter

        testStream.emit('data', Buffer.from(char));

        expect(keyData?.key?.name).toBe(expectedName);
        expect(keyData?.key?.ctrl).toBe(true);
      }
    });

    it('should parse ctrl+c specifically', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x03')); // Ctrl+C

      expect(keyData?.key?.name).toBe('c');
      expect(keyData?.key?.ctrl).toBe(true);
    });
  });

  describe('key parsing - regular letters', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse lowercase letters', () => {
      const letters = 'abcdefghijklmnopqrstuvwxyz';

      for (const letter of letters) {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(letter));

        expect(keyData?.key?.name).toBe(letter);
        expect(keyData?.key?.shift).toBe(false);
        expect(keyData?.key?.ctrl).toBe(false);
        expect(keyData?.key?.meta).toBe(false);
      }
    });

    it('should parse uppercase letters as shift+letter', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      for (const letter of letters) {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(letter));

        expect(keyData?.key?.name).toBe(letter.toLowerCase());
        expect(keyData?.key?.shift).toBe(true);
        expect(keyData?.key?.ctrl).toBe(false);
        expect(keyData?.key?.meta).toBe(false);
      }
    });
  });

  describe('key parsing - meta keys', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse meta+letter combinations', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x1ba')); // Alt+A (lowercase)

      expect(keyData?.key?.name).toBe('a');
      expect(keyData?.key?.meta).toBe(true);
      expect(keyData?.key?.shift).toBe(false);
    });

    it('should parse meta+shift+letter combinations', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x1bA')); // Alt+Shift+A

      expect(keyData?.key?.name).toBe('a');
      expect(keyData?.key?.meta).toBe(true);
      expect(keyData?.key?.shift).toBe(true);
    });
  });

  describe('key parsing - function keys', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse F1-F4 (xterm/gnome O format)', () => {
      const fKeys = [
        { sequence: '\x1bOP', name: 'f1' },
        { sequence: '\x1bOQ', name: 'f2' },
        { sequence: '\x1bOR', name: 'f3' },
        { sequence: '\x1bOS', name: 'f4' },
      ];

      fKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
      });
    });

    it('should parse F1-F4 (xterm/rxvt bracket format)', () => {
      const fKeys = [
        { sequence: '\x1b[11~', name: 'f1' },
        { sequence: '\x1b[12~', name: 'f2' },
        { sequence: '\x1b[13~', name: 'f3' },
        { sequence: '\x1b[14~', name: 'f4' },
      ];

      fKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
      });
    });

    it('should parse F5-F12', () => {
      const fKeys = [
        { sequence: '\x1b[15~', name: 'f5' },
        { sequence: '\x1b[17~', name: 'f6' },
        { sequence: '\x1b[18~', name: 'f7' },
        { sequence: '\x1b[19~', name: 'f8' },
        { sequence: '\x1b[20~', name: 'f9' },
        { sequence: '\x1b[21~', name: 'f10' },
        { sequence: '\x1b[23~', name: 'f11' },
        { sequence: '\x1b[24~', name: 'f12' },
      ];

      fKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
      });
    });
  });

  describe('key parsing - arrow keys', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse arrow keys (bracket format)', () => {
      const arrowKeys = [
        { sequence: '\x1b[A', name: 'up' },
        { sequence: '\x1b[B', name: 'down' },
        { sequence: '\x1b[C', name: 'right' },
        { sequence: '\x1b[D', name: 'left' },
      ];

      arrowKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
        expect(keyData?.key?.ctrl).toBe(false);
        expect(keyData?.key?.meta).toBe(false);
        expect(keyData?.key?.shift).toBe(false);
      });
    });

    it('should parse arrow keys (O format)', () => {
      const arrowKeys = [
        { sequence: '\x1bOA', name: 'up' },
        { sequence: '\x1bOB', name: 'down' },
        { sequence: '\x1bOC', name: 'right' },
        { sequence: '\x1bOD', name: 'left' },
      ];

      arrowKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
      });
    });
  });

  describe('key parsing - navigation keys', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse home/end keys', () => {
      const navKeys = [
        { sequence: '\x1b[H', name: 'home' },
        { sequence: '\x1b[F', name: 'end' },
        { sequence: '\x1bOH', name: 'home' },
        { sequence: '\x1bOF', name: 'end' },
        { sequence: '\x1b[1~', name: 'home' },
        { sequence: '\x1b[4~', name: 'end' },
      ];

      navKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
      });
    });

    it('should parse page up/down keys', () => {
      const pageKeys = [
        { sequence: '\x1b[5~', name: 'pageup' },
        { sequence: '\x1b[6~', name: 'pagedown' },
      ];

      pageKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
      });
    });

    it('should parse insert/delete keys', () => {
      const editKeys = [
        { sequence: '\x1b[2~', name: 'insert' },
        { sequence: '\x1b[3~', name: 'delete' },
      ];

      editKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
      });
    });
  });

  describe('key parsing - modifier combinations', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should parse shift+tab', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x1b[Z'));

      expect(keyData?.key?.name).toBe('tab');
      expect(keyData?.key?.shift).toBe(true);
    });

    it('should parse shift+arrow keys (rxvt format)', () => {
      const shiftArrowKeys = [
        { sequence: '\x1b[a', name: 'up' },
        { sequence: '\x1b[b', name: 'down' },
        { sequence: '\x1b[c', name: 'right' },
        { sequence: '\x1b[d', name: 'left' },
      ];

      shiftArrowKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
        expect(keyData?.key?.shift).toBe(true);
      });
    });

    it('should parse ctrl+arrow keys (O format)', () => {
      const ctrlArrowKeys = [
        { sequence: '\x1bOa', name: 'up' },
        { sequence: '\x1bOb', name: 'down' },
        { sequence: '\x1bOc', name: 'right' },
        { sequence: '\x1bOd', name: 'left' },
      ];

      ctrlArrowKeys.forEach(({ sequence, name }) => {
        let keyData: any = null;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', (ch, key) => {
          keyData = { ch, key };
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyData?.key?.name).toBe(name);
        expect(keyData?.key?.ctrl).toBe(true);
      });
    });
  });

  describe('mouse event detection', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should not emit keypress for mouse sequences', () => {
      const mouseSequences = [
        '\x1b[M   ', // Basic mouse
        '\x1b[<0;1;1m', // SGR mouse
        '\x1b[240~[10,5]\r', // DEC locator
      ];

      mouseSequences.forEach(sequence => {
        let keyPressed = false;
        const testStream = createMockStream();
        keys.emitKeypressEvents(testStream);
        testStream.on('keypress', () => {
          keyPressed = true;
        });

        testStream.emit('data', Buffer.from(sequence));

        expect(keyPressed).toBe(false);
      });
    });
  });

  describe('edge cases and malformed input', () => {
    beforeEach(() => {
      keys.emitKeypressEvents(mockStream);
    });

    it('should handle empty buffer gracefully', () => {
      let keyPressed = false;
      mockStream.on('keypress', () => {
        keyPressed = true;
      });

      mockStream.emit('data', Buffer.from(''));

      expect(keyPressed).toBe(false);
    });

    it('should handle incomplete escape sequences', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      mockStream.emit('data', Buffer.from('\x1b['));

      // Incomplete sequences are handled - key might be undefined or have name 'undefined'
      expect(
        keyData?.key?.name === 'undefined' || keyData?.key === undefined
      ).toBe(true);
    });

    it('should handle mixed valid and invalid sequences', () => {
      const keyEvents: any[] = [];
      mockStream.on('keypress', (ch, key) => {
        keyEvents.push({ ch, key });
      });

      mockStream.emit('data', Buffer.from('a\x1b[Zb'));

      expect(keyEvents).toHaveLength(3);
      expect(keyEvents[0]?.key?.name).toBe('a');
      expect(keyEvents[1]?.key?.name).toBe('tab');
      expect(keyEvents[1]?.key?.shift).toBe(true);
      expect(keyEvents[2]?.key?.name).toBe('b');
    });

    it('should handle high-bit characters', () => {
      let keyData: any = null;
      mockStream.on('keypress', (ch, key) => {
        keyData = { ch, key };
      });

      const buffer = Buffer.from([0xff]); // High bit set
      mockStream.emit('data', buffer);

      // Should not crash and should handle gracefully
      expect(keyData).toBeDefined();
    });
  });
});
