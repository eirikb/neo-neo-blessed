import { describe, it, expect } from 'vitest';
import { EventEmitter as NodeEventEmitter } from 'events';
import http from 'http';
import type { AddressInfo } from 'net';

// Captured before any blessed module is imported, so the "leaves Node alone" tests compare
// against Node's untouched implementation.
const NODE_METHODS = [
  'setMaxListeners',
  'addListener',
  'on',
  'removeListener',
  'off',
  'removeAllListeners',
  'once',
  'listeners',
  'emit',
] as const;
const originalNodeMethods = Object.fromEntries(
  NODE_METHODS.map(name => [name, NodeEventEmitter.prototype[name]])
);

describe('blessed EventEmitter', () => {
  describe('does not modify Node’s EventEmitter', () => {
    it('leaves EventEmitter.prototype untouched after importing the whole library', async () => {
      await import('../../lib/blessed.js');

      for (const name of NODE_METHODS) {
        expect(NodeEventEmitter.prototype[name], name).toBe(
          originalNodeMethods[name]
        );
      }
      expect(Object.hasOwn(NodeEventEmitter.prototype, '_emit')).toBe(false);
    });

    it('keeps native emitters chainable (Node internals rely on `.on(...).on(...)`)', async () => {
      await import('../../lib/blessed.js');

      const emitter = new NodeEventEmitter();
      const calls: string[] = [];
      const result = emitter
        .on('a', () => calls.push('a'))
        .once('b', () => calls.push('b'))
        .addListener('c', () => calls.push('c'));

      expect(result).toBe(emitter);
      emitter.emit('a');
      emitter.emit('b');
      emitter.emit('b');
      emitter.emit('c');
      expect(calls).toEqual(['a', 'b', 'c']);
    });

    it('keeps native emitters throwing on an unhandled error event', async () => {
      await import('../../lib/blessed.js');

      const error = new Error('boom');
      expect(() => new NodeEventEmitter().emit('error', error)).toThrow(error);
    });

    it('keeps global fetch working after the library is imported', async () => {
      await import('../../lib/blessed.js');

      const server = http.createServer((_req, res) => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      });
      await new Promise<void>(resolve =>
        server.listen(0, '127.0.0.1', resolve)
      );
      try {
        const { port } = server.address() as AddressInfo;
        const response = await fetch(`http://127.0.0.1:${port}/`);
        expect(await response.json()).toEqual({ ok: true });
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });

  describe('blessed’s own emitter', () => {
    it('is a subclass of Node’s EventEmitter', async () => {
      const { EventEmitter } = await import('../../lib/events.js');

      const emitter = new EventEmitter();
      expect(emitter).toBeInstanceOf(NodeEventEmitter);
      expect(EventEmitter.prototype).not.toBe(NodeEventEmitter.prototype);
      expect(Object.getPrototypeOf(EventEmitter.prototype)).toBe(
        NodeEventEmitter.prototype
      );
    });

    it('is what Program and Node widgets inherit from', async () => {
      const { EventEmitter } = await import('../../lib/events.js');
      const { default: Program } = await import('../../lib/program.js');
      const { default: Node } = await import('../../lib/widgets/node.js');

      expect(Object.getPrototypeOf(Program.prototype)).toBe(
        EventEmitter.prototype
      );
      expect(Object.getPrototypeOf(Node.prototype)).toBe(
        EventEmitter.prototype
      );
    });

    it('handles add/remove/emit on a fresh emitter', async () => {
      const { EventEmitter } = await import('../../lib/events.js');

      const emitter: any = new EventEmitter();
      const calls: string[] = [];
      const listener = (value: string) => calls.push(value);

      emitter.addListener('mount', listener);
      expect(emitter.listenerCount('mount')).toBe(1);
      emitter.emit('mount', 'first');
      emitter.removeListener('mount', listener);
      emitter.emit('mount', 'second');
      expect(calls).toEqual(['first']);

      expect(() =>
        emitter.removeListener('nonexistent', () => {})
      ).not.toThrow();
      expect(() => emitter.removeAllListeners()).not.toThrow();
      expect(() => emitter.removeAllListeners('specific')).not.toThrow();
      expect(emitter.listeners('test')).toEqual([]);
    });

    it('fires once listeners a single time', async () => {
      const { EventEmitter } = await import('../../lib/events.js');

      const emitter: any = new EventEmitter();
      let count = 0;
      emitter.once('test', () => {
        count++;
      });
      emitter.emit('test');
      emitter.emit('test');
      expect(count).toBe(1);
    });

    it('emits the catch-all `event` event and bubbles `element <type>` up the parent chain', async () => {
      const { EventEmitter } = await import('../../lib/events.js');

      const parent: any = new EventEmitter();
      const child: any = new EventEmitter();
      child.parent = parent;
      const seen: unknown[][] = [];
      child.on('event', (...args: unknown[]) => seen.push(['event', ...args]));
      parent.on('element click', (el: unknown, data: unknown) =>
        seen.push(['bubbled', el, data])
      );

      child.emit('click', 42);
      expect(seen).toEqual([
        ['event', 'click', 42],
        ['bubbled', child, 42],
      ]);
    });

    it('stops bubbling when a listener returns false', async () => {
      const { EventEmitter } = await import('../../lib/events.js');

      const parent: any = new EventEmitter();
      const child: any = new EventEmitter();
      child.parent = parent;
      let bubbled = false;
      child.on('click', () => false);
      parent.on('element click', () => {
        bubbled = true;
      });

      expect(child.emit('click')).toBe(false);
      expect(bubbled).toBe(false);
    });
  });
});
