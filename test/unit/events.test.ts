import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

describe('EventEmitter compatibility', () => {
  let originalPrototype: any;

  beforeEach(() => {
    originalPrototype = {
      addListener: EventEmitter.prototype.addListener,
      on: EventEmitter.prototype.on,
      removeListener: EventEmitter.prototype.removeListener,
      off: EventEmitter.prototype.off,
      removeAllListeners: EventEmitter.prototype.removeAllListeners,
      once: EventEmitter.prototype.once,
      emit: EventEmitter.prototype.emit,
      listeners: EventEmitter.prototype.listeners,
      setMaxListeners: EventEmitter.prototype.setMaxListeners,
    };
  });

  afterEach(() => {
    Object.keys(originalPrototype).forEach(key => {
      EventEmitter.prototype[key] = originalPrototype[key];
    });
  });

  describe('Express-like usage pattern', () => {
    it('should handle EventEmitter instances without _events property', async () => {
      await import('../../lib/events.js');

      const emitter = new EventEmitter();

      expect(() => {
        emitter.addListener('mount', () => {
          console.log('mounted');
        });
      }).not.toThrow();

      expect(emitter.listenerCount('mount')).toBe(1);
    });

    it('should handle removeListener on uninitialized EventEmitter', async () => {
      await import('../../lib/events.js');

      const emitter = new EventEmitter();

      expect(() => {
        emitter.removeListener('nonexistent', () => {});
      }).not.toThrow();
    });

    it('should handle removeAllListeners on uninitialized EventEmitter', async () => {
      await import('../../lib/events.js');

      const emitter = new EventEmitter();

      // Should not throw when removing all listeners
      expect(() => {
        emitter.removeAllListeners();
      }).not.toThrow();

      expect(() => {
        emitter.removeAllListeners('specific');
      }).not.toThrow();
    });

    it('should handle emit on uninitialized EventEmitter', async () => {
      await import('../../lib/events.js');

      const emitter = new EventEmitter();

      // Should not throw when emitting events
      expect(() => {
        emitter.emit('test', 'data');
      }).not.toThrow();
    });

    it('should handle once on uninitialized EventEmitter', async () => {
      await import('../../lib/events.js');

      const emitter = new EventEmitter();
      let called = false;

      // Should not throw when using once
      expect(() => {
        emitter.once('test', () => {
          called = true;
        });
      }).not.toThrow();

      emitter.emit('test');
      expect(called).toBe(true);

      // Verify it only fires once
      called = false;
      emitter.emit('test');
      expect(called).toBe(false);
    });

    it('should handle listeners on uninitialized EventEmitter', async () => {
      await import('../../lib/events.js');

      const emitter = new EventEmitter();

      // Should not throw and return empty array
      expect(() => {
        const listeners = emitter.listeners('test');
        expect(listeners).toEqual([]);
      }).not.toThrow();
    });
  });

  describe('Mixed usage with blessed widgets', () => {
    it('should work with both native EventEmitters and blessed objects', async () => {
      await import('../../lib/events.js');

      // Native EventEmitter (like Express uses)
      const nativeEmitter = new EventEmitter();

      // Simulated blessed object with _events already initialized
      const blessedEmitter: any = new EventEmitter();
      blessedEmitter._events = {};
      blessedEmitter.type = 'screen';

      // Both should work without errors
      expect(() => {
        nativeEmitter.on('test', () => {});
        blessedEmitter.on('test', () => {});
      }).not.toThrow();

      expect(() => {
        nativeEmitter.emit('test');
        blessedEmitter.emit('test');
      }).not.toThrow();
    });
  });

  describe('Event bubbling compatibility', () => {
    it('should handle parent chain traversal safely', async () => {
      await import('../../lib/events.js');

      const child: any = new EventEmitter();
      const parent: any = new EventEmitter();
      child.parent = parent;

      // Should not throw even with uninitialized _events
      expect(() => {
        child.emit('test');
      }).not.toThrow();
    });
  });
});
