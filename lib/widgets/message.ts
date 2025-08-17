/**
 * message.js - message element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;

/**
 * Type definitions
 */

interface MessageOptions {
  tags?: boolean;
  vi?: boolean;
  mouse?: boolean;
  ignoreKeys?: string[];
  scrollable?: boolean;
  [key: string]: any;
}

interface KeyData {
  name: string;
  ctrl?: boolean;
  shift?: boolean;
}

interface MouseData {
  action: string;
}

interface MessageScreen {
  saveFocus(): void;
  restoreFocus(): void;
  render(): void;
}

interface MessageInterface extends Box {
  type: string;
  scrollable?: boolean;
  options: MessageOptions;
  screen: MessageScreen;
  show(): void;
  hide(): void;
  focus(): void;
  scrollTo(position: number): void;
  setContent(text: string): void;
  onScreenEvent(event: string, listener: (...args: any[]) => void): void;
  removeScreenEvent(event: string, listener: (...args: any[]) => void): void;
  display(
    text: string,
    time?: number | (() => void),
    callback?: () => void
  ): void;
  log(text: string, time?: number | (() => void), callback?: () => void): void;
  error(text: string, time?: number, callback?: () => void): void;
}

/**
 * Message - Modern ES6 Class
 */

class Message extends Box {
  type = 'message';

  constructor(options?: MessageOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Set default tags behavior for messages
    options.tags = true;

    super(options);
  }

  display(
    text: string,
    time?: number | (() => void),
    callback?: () => void
  ): void {
    const self = this;

    if (typeof time === 'function') {
      callback = time;
      time = null;
    }

    if (time == null) time = 3;

    // Keep above:
    // var parent = this.parent;
    // this.detach();
    // parent.append(this);

    if (this.scrollable) {
      this.screen.saveFocus();
      this.focus();
      this.scrollTo(0);
    }

    this.show();
    this.setContent(text);
    this.screen.render();

    if (time === Infinity || time === -1 || time === 0) {
      const end = function () {
        if ((end as any).done) return;
        (end as any).done = true;
        if (self.scrollable) {
          try {
            self.screen.restoreFocus();
          } catch (e) {}
        }
        self.hide();
        self.screen.render();
        if (callback) callback();
      };

      setTimeout(function () {
        self.onScreenEvent('keypress', function fn(ch: string, key: KeyData) {
          if (key.name === 'mouse') return;
          if (self.scrollable) {
            if (
              key.name === 'up' ||
              (self.options.vi && key.name === 'k') ||
              key.name === 'down' ||
              (self.options.vi && key.name === 'j') ||
              (self.options.vi && key.name === 'u' && key.ctrl) ||
              (self.options.vi && key.name === 'd' && key.ctrl) ||
              (self.options.vi && key.name === 'b' && key.ctrl) ||
              (self.options.vi && key.name === 'f' && key.ctrl) ||
              (self.options.vi && key.name === 'g' && !key.shift) ||
              (self.options.vi && key.name === 'g' && key.shift)
            ) {
              return;
            }
          }
          if (
            self.options.ignoreKeys &&
            self.options.ignoreKeys.indexOf(key.name) !== -1
          ) {
            return;
          }
          self.removeScreenEvent('keypress', fn);
          end();
        });
        // XXX May be affected by new element.options.mouse option.
        if (!self.options.mouse) return;
        self.onScreenEvent('mouse', function fn(data: MouseData) {
          if (data.action === 'mousemove') return;
          self.removeScreenEvent('mouse', fn);
          end();
        });
      }, 10);

      return;
    }

    setTimeout(
      function () {
        self.hide();
        self.screen.render();
        if (callback) callback();
      },
      (time as number) * 1000
    );
  }

  log(text: string, time?: number | (() => void), callback?: () => void): void {
    return this.display(text, time, callback);
  }

  error(text: string, time?: number, callback?: () => void): void {
    return this.display('{red-fg}Error: ' + text + '{/red-fg}', time, callback);
  }
}

/**
 * Factory function for backward compatibility
 */
function message(options?: MessageOptions): MessageInterface {
  return new Message(options) as MessageInterface;
}

// Attach the class as a property for direct access
message.Message = Message;

/**
 * Expose
 */

export default message;
