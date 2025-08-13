/**
 * textbox.js - textbox element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Textarea = require('./textarea');

/**
 * Type definitions
 */

interface TextboxOptions {
  scrollable?: boolean;
  secret?: boolean;
  censor?: boolean;
  [key: string]: any;
}

interface TextboxKey {
  name: string;
}

interface TextboxScreen {
  tabc: string;
}

interface TextboxInterface extends Textarea {
  type: string;
  secret?: boolean;
  censor?: boolean;
  value: string;
  _value: string;
  width: number;
  iwidth: number;
  screen: TextboxScreen;
  __listener?: (ch: string, key: TextboxKey) => void;
  __olistener: (ch: string, key: TextboxKey) => any;
  _listener: (ch: string, key: TextboxKey) => any;
  _done: (err: any, value?: string) => void;
  setContent(content: string): void;
  _updateCursor(): void;
  setValue(value?: string): void;
  submit(): any;
}

/**
 * Textbox
 */

function Textbox(this: TextboxInterface, options?: TextboxOptions) {
  if (!(this instanceof Node)) {
    return new (Textbox as any)(options);
  }

  options = options || {};

  options.scrollable = false;

  Textarea.call(this, options);

  this.secret = options.secret;
  this.censor = options.censor;
}

Textbox.prototype.__proto__ = Textarea.prototype;

Textbox.prototype.type = 'textbox';

Textbox.prototype.__olistener = Textbox.prototype._listener;
Textbox.prototype._listener = function (
  this: TextboxInterface,
  ch: string,
  key: TextboxKey
): any {
  if (key.name === 'enter') {
    this._done(null, this.value);
    return;
  }
  return this.__olistener(ch, key);
};

Textbox.prototype.setValue = function (
  this: TextboxInterface,
  value?: string
): void {
  let visible: number, val: string;
  if (value == null) {
    value = this.value;
  }
  if (this._value !== value) {
    value = value.replace(/\n/g, '');
    this.value = value;
    this._value = value;
    if (this.secret) {
      this.setContent('');
    } else if (this.censor) {
      this.setContent(Array(this.value.length + 1).join('*'));
    } else {
      visible = -(this.width - this.iwidth - 1);
      val = this.value.replace(/\t/g, this.screen.tabc);
      this.setContent(val.slice(visible));
    }
    this._updateCursor();
  }
};

Textbox.prototype.submit = function (this: TextboxInterface): any {
  if (!this.__listener) return;
  return this.__listener('\r', { name: 'enter' });
};

/**
 * Expose
 */

module.exports = Textbox;
