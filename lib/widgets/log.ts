/**
 * log.js - log element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as util from 'util';

const nextTick = (global as any).setImmediate || process.nextTick.bind(process);

import Node from './node.js';
import scrollableText from './scrollabletext.js';

// Extract the ScrollableText class from the factory function
const ScrollableText = scrollableText.ScrollableText;

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
 * Log - Modern ES6 Class
 */

class Log extends ScrollableText {
  type = 'log';
  scrollback: number;
  scrollOnInput?: boolean;
  _userScrolled: boolean = false;
  _originalScroll: any;

  constructor(options?: LogOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    this.scrollback =
      options.scrollback != null ? options.scrollback : Infinity;
    this.scrollOnInput = options.scrollOnInput;

    // Store original scroll method for later use
    this._originalScroll = super.scroll;

    const self = this;
    this.on('set content', function () {
      if (!self._userScrolled || self.scrollOnInput) {
        nextTick(function () {
          self.setScrollPerc(100);
          self._userScrolled = false;
          self.screen.render();
        });
      }
    });
  }

  log(...args: any[]): any {
    const argsArray = Array.prototype.slice.call(arguments);
    if (typeof argsArray[0] === 'object') {
      let output = util.inspect(argsArray[0], {
        depth: 1,
        colors: true,
        maxArrayLength: 50,
      });
      if (output.length < 1000) {
        output = util.inspect(argsArray[0], {
          depth: 2,
          colors: true,
          maxArrayLength: 50,
        });
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
  }

  // Alias for log method
  add(...args: any[]): any {
    return this.log(...args);
  }

  scroll(offset: number, always?: boolean): any {
    if (offset === 0) return this._originalScroll.call(this, offset, always);
    this._userScrolled = true;
    const ret = this._originalScroll.call(this, offset, always);
    if (this.getScrollPerc() === 100) {
      this._userScrolled = false;
    }
    return ret;
  }
}

/**
 * Factory function for backward compatibility
 */
function log(options?: LogOptions): LogInterface {
  return new Log(options) as LogInterface;
}

// Attach the class as a property for direct access
log.Log = Log;

/**
 * Expose
 */

export default log;
