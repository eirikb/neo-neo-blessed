/**
 * radiobutton.js - radio button element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Checkbox = require('./checkbox');

/**
 * Type definitions
 */

interface RadioButtonOptions {
  [key: string]: any;
}

interface RadioButtonInterface extends Checkbox {
  type: string;
  checked: boolean;
  text: string;
  parent?: RadioButtonInterface;
  on(event: string, listener: (...args: any[]) => void): void;
  clearPos(arg: boolean): void;
  setContent(content: string, noTags: boolean): void;
  _render(): any;
  uncheck(): void;
  forDescendants(callback: (el: RadioButtonInterface) => void): void;
}

/**
 * RadioButton
 */

function RadioButton(this: RadioButtonInterface, options?: RadioButtonOptions) {
  const self = this;

  if (!(this instanceof Node)) {
    return new (RadioButton as any)(options);
  }

  options = options || {};

  Checkbox.call(this, options);

  this.on('check', function() {
    let el: RadioButtonInterface | undefined = self;
    while (el = el.parent) {
      if (el.type === 'radio-set'
          || el.type === 'form') break;
    }
    el = el || self.parent;
    if (el) {
      el.forDescendants(function(el: RadioButtonInterface) {
        if (el.type !== 'radio-button' || el === self) {
          return;
        }
        el.uncheck();
      });
    }
  });
}

RadioButton.prototype.__proto__ = Checkbox.prototype;

RadioButton.prototype.type = 'radio-button';

RadioButton.prototype.render = function(this: RadioButtonInterface) {
  this.clearPos(true);
  this.setContent('(' + (this.checked ? '*' : ' ') + ') ' + this.text, true);
  return this._render();
};

RadioButton.prototype.toggle = RadioButton.prototype.check;

/**
 * Expose
 */

module.exports = RadioButton;