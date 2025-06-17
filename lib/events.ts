/**
 * events.js - event emitter for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

const slice = Array.prototype.slice;

/**
 * Type definitions
 */

import { EventEmitterInterface } from './types/index';

type Listener = (...args: any[]) => any;

interface ListenerWithOriginal extends Listener {
  listener?: Listener;
}

/**
 * EventEmitter
 */

function EventEmitter(this: EventEmitterInterface) {
  if (!this._events) this._events = {};
}

EventEmitter.prototype.setMaxListeners = function (
  this: EventEmitterInterface,
  n: number
): void {
  this._maxListeners = n;
};

EventEmitter.prototype.addListener = function (
  this: EventEmitterInterface,
  type: string,
  listener: Listener
): void {
  if (!this._events![type]) {
    this._events![type] = listener;
  } else if (typeof this._events![type] === 'function') {
    this._events![type] = [this._events![type] as Listener, listener];
  } else {
    (this._events![type] as Listener[]).push(listener);
  }
  this._emit('newListener', [type, listener]);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.removeListener = function (
  this: EventEmitterInterface,
  type: string,
  listener: Listener
): void {
  const handler = this._events![type];
  if (!handler) return;

  if (typeof handler === 'function' || (handler as Listener[])?.length === 1) {
    delete this._events![type];
    this._emit('removeListener', [type, listener]);
    return;
  }

  const handlers = handler as ListenerWithOriginal[];
  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i] === listener || handlers[i]?.listener === listener) {
      handlers.splice(i, 1);
      this._emit('removeListener', [type, listener]);
      return;
    }
  }
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function (
  this: EventEmitterInterface,
  type?: string
): void {
  if (type) {
    delete this._events![type];
  } else {
    this._events = {};
  }
};

EventEmitter.prototype.once = function (
  this: EventEmitterInterface,
  type: string,
  listener: Listener
): EventEmitterInterface {
  const self = this;
  function on(this: EventEmitterInterface, ...args: any[]): any {
    self.removeListener(type, on);
    return listener.apply(this, args);
  }
  (on as ListenerWithOriginal).listener = listener;
  return this.on(type, on);
};

EventEmitter.prototype.listeners = function (
  this: EventEmitterInterface,
  type: string
): Listener[] {
  if (!this._events) return [];
  const handler = this._events?.[type];
  return typeof handler === 'function'
    ? [handler as Listener]
    : (handler as Listener[]) || [];
};

EventEmitter.prototype._emit = function (
  this: EventEmitterInterface,
  type: string,
  args: any[]
): any {
  if (!this._events) return;
  const handler = this._events?.[type];
  let ret: any;

  // if (type !== 'event') {
  //   this._emit('event', [type.replace(/^element /, '')].concat(args));
  // }

  if (!handler) {
    if (type === 'error') {
      throw new args[0]();
    }
    return;
  }

  if (typeof handler === 'function') {
    return handler?.apply(this, args);
  }

  const handlers = handler as Listener[];
  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i]?.apply(this, args) === false) {
      ret = false;
    }
  }

  return ret !== false;
};

EventEmitter.prototype.emit = function (
  this: EventEmitterInterface,
  type: string,
  ..._eventArgs: any[]
): boolean {
  const args = slice.call(arguments, 1);
  const params = slice.call(arguments);
  let el: EventEmitterInterface | undefined = this;

  this._emit('event', params);

  if ((this as any).type === 'screen') {
    return this._emit(type, args);
  }

  if (this._emit(type, args) === false) {
    return false;
  }

  const elementType = 'element ' + type;
  args.unshift(this);
  // `element` prefix
  // params = [elementType].concat(args);
  // no `element` prefix
  // params.splice(1, 0, this);

  do {
    // el._emit('event', params);
    if (!el._events![elementType]) continue;
    if (el._emit(elementType, args) === false) {
      return false;
    }
  } while ((el = (el as any).parent));

  return true;
};

// For hooking into the main EventEmitter if we want to.
// Might be better to do things this way being that it
// will always be compatible with node, not to mention
// it gives us domain support as well.
// Node.prototype._emit = Node.prototype.emit;
// Node.prototype.emit = function(type) {
//   var args, el;
//
//   if (this.type === 'screen') {
//     return this._emit.apply(this, arguments);
//   }
//
//   this._emit.apply(this, arguments);
//   if (this._bubbleStopped) return false;
//
//   args = slice.call(arguments, 1);
//   el = this;
//
//   args.unshift('element ' + type, this);
//   this._bubbleStopped = false;
//   //args.push(stopBubble);
//
//   do {
//     if (!el._events || !el._events[type]) continue;
//     el._emit.apply(el, args);
//     if (this._bubbleStopped) return false;
//   } while (el = el.parent);
//
//   return true;
// };
//
// Node.prototype._addListener = Node.prototype.addListener;
// Node.prototype.on =
// Node.prototype.addListener = function(type, listener) {
//   function on() {
//     if (listener.apply(this, arguments) === false) {
//       this._bubbleStopped = true;
//     }
//   }
//   on.listener = listener;
//   return this._addListener(type, on);
// };

/**
 * Expose
 */

const exports = EventEmitter as any;
exports.EventEmitter = EventEmitter;

module.exports = exports;
