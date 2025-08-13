/**
 * button.js - button element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Input = require('./input');

/**
 * Type definitions
 */

interface ButtonOptions {
  autoFocus?: boolean;
  mouse?: boolean;
  [key: string]: any;
}

interface ButtonKey {
  name: string;
}

interface ButtonInterface extends Input {
  type: string;
  options: ButtonOptions;
  value?: boolean;
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  focus(): void;
  press(): boolean;
}

/**
 * Button
 */

function Button(this: ButtonInterface, options?: ButtonOptions) {
  const self = this;

  if (!(this instanceof Node)) {
    return new (Button as any)(options);
  }

  options = options || {};

  if (options.autoFocus == null) {
    options.autoFocus = false;
  }

  Input.call(this, options);

  this.on('keypress', function (ch: string, key: ButtonKey) {
    if (key.name === 'enter' || key.name === 'space') {
      return self.press();
    }
  });

  if (this.options.mouse) {
    this.on('click', function () {
      return self.press();
    });
  }
}

Button.prototype.__proto__ = Input.prototype;

Button.prototype.type = 'button';

Button.prototype.press = function (this: ButtonInterface): boolean {
  this.focus();
  this.value = true;
  const result = this.emit('press');
  delete this.value;
  return result;
};

/**
 * Expose
 */

module.exports = Button;
