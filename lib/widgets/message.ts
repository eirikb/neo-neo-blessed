/**
 * message.js - message element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Box = require('./box');

/**
 * Type definitions
 */

interface MessageOptions {
  tags?: boolean;
  vi?: boolean;
  mouse?: boolean;
  ignoreKeys?: string[];
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
}

/**
 * Message / Error
 */

function Message(this: MessageInterface, options?: MessageOptions) {
  if (!(this instanceof Node)) {
    return new (Message as any)(options);
  }

  options = options || {};
  options.tags = true;

  Box.call(this, options);
}

Message.prototype.__proto__ = Box.prototype;

Message.prototype.type = 'message';

Message.prototype.log =
Message.prototype.display = function(this: MessageInterface, text: string, time?: number | (() => void), callback?: () => void): void {
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
    const end = function() {
      if ((end as any).done) return;
      (end as any).done = true;
      if (self.scrollable) {
        try {
          self.screen.restoreFocus();
        } catch (e) {
          ;
        }
      }
      self.hide();
      self.screen.render();
      if (callback) callback();
    };

    setTimeout(function() {
      self.onScreenEvent('keypress', function fn(ch: string, key: KeyData) {
        if (key.name === 'mouse') return;
        if (self.scrollable) {
          if ((key.name === 'up' || (self.options.vi && key.name === 'k'))
            || (key.name === 'down' || (self.options.vi && key.name === 'j'))
            || (self.options.vi && key.name === 'u' && key.ctrl)
            || (self.options.vi && key.name === 'd' && key.ctrl)
            || (self.options.vi && key.name === 'b' && key.ctrl)
            || (self.options.vi && key.name === 'f' && key.ctrl)
            || (self.options.vi && key.name === 'g' && !key.shift)
            || (self.options.vi && key.name === 'g' && key.shift)) {
            return;
          }
        }
        if (self.options.ignoreKeys && self.options.ignoreKeys.indexOf(key.name) !== -1) {
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

  setTimeout(function() {
    self.hide();
    self.screen.render();
    if (callback) callback();
  }, (time as number) * 1000);
};

Message.prototype.error = function(this: MessageInterface, text: string, time?: number, callback?: () => void): void {
  return this.display('{red-fg}Error: ' + text + '{/red-fg}', time, callback);
};

/**
 * Expose
 */

module.exports = Message;