/**
 * log.js - log element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const util = require('util');

const nextTick = (global as any).setImmediate || process.nextTick.bind(process);

const Node = require('./node');
const ScrollableText = require('./scrollabletext');

/**
 * Type definitions
 */

interface LogOptions {
  scrollback?: number;
  scrollOnInput?: boolean;
  [key: string]: any;
}

interface LogScreen {
  render(): void;
}

interface LogInterface extends ScrollableText {
  type: string;
  scrollback: number;
  scrollOnInput?: boolean;
  screen: LogScreen;
  _userScrolled: boolean;
  _clines: {
    fake: any[];
  };
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  setScrollPerc(percentage: number): void;
  getScrollPerc(): number;
  pushLine(text: string): any;
  shiftLine(start: number, count: number): void;
  _scroll(offset: number, always?: boolean): any;
}

/**
 * Log
 */

function Log(this: LogInterface, options?: LogOptions) {
  const self = this;

  if (!(this instanceof Node)) {
    return new (Log as any)(options);
  }

  options = options || {};

  ScrollableText.call(this, options);

  this.scrollback = options.scrollback != null
    ? options.scrollback
    : Infinity;
  this.scrollOnInput = options.scrollOnInput;

  this.on('set content', function() {
    if (!self._userScrolled || self.scrollOnInput) {
      nextTick(function() {
        self.setScrollPerc(100);
        self._userScrolled = false;
        self.screen.render();
      });
    }
  });
}

Log.prototype.__proto__ = ScrollableText.prototype;

Log.prototype.type = 'log';

Log.prototype.log =
Log.prototype.add = function(this: LogInterface, ...args: any[]): any {
  const argsArray = Array.prototype.slice.call(arguments);
  if (typeof argsArray[0] === 'object') {
    let output = util.inspect(argsArray[0], {depth: 1, colors: true, maxArrayLength: 50});
    if (output.length < 1000) {
      output = util.inspect(argsArray[0], {depth: 2, colors: true, maxArrayLength: 50});
    }
    argsArray[0] = output;
  }
  const text = util.format.apply(util, argsArray);
  this.emit('log', text);
  const ret = this.pushLine(text);
  if (this._clines.fake.length > this.scrollback) {
    this.shiftLine(0, (this.scrollback / 3) | 0);
  }
  return ret;
};

Log.prototype._scroll = Log.prototype.scroll;
Log.prototype.scroll = function(this: LogInterface, offset: number, always?: boolean): any {
  if (offset === 0) return this._scroll(offset, always);
  this._userScrolled = true;
  const ret = this._scroll(offset, always);
  if (this.getScrollPerc() === 100) {
    this._userScrolled = false;
  }
  return ret;
};

/**
 * Expose
 */

module.exports = Log;