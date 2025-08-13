/**
 * checkbox.js - checkbox element for blessed
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

interface CheckboxOptions {
  content?: string;
  text?: string;
  checked?: boolean;
  mouse?: boolean;
  [key: string]: any;
}

interface CheckboxKey {
  name: string;
}

interface CheckboxPosition {
  yi: number;
  xi: number;
}

interface CheckboxProgram {
  lsaveCursor(id: string): void;
  lrestoreCursor(id: string, hide?: boolean): void;
  cup(y: number, x: number): void;
  showCursor(): void;
}

interface CheckboxScreen {
  render(): void;
  program: CheckboxProgram;
}

interface CheckboxInterface extends Input {
  type: string;
  text: string;
  checked: boolean;
  value: boolean;
  lpos?: CheckboxPosition;
  screen: CheckboxScreen;
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  clearPos(force?: boolean): void;
  setContent(content: string, noClear?: boolean): void;
  _render(): any;
  render(): any;
  check(): void;
  uncheck(): void;
  toggle(): void;
}

/**
 * Checkbox
 */

function Checkbox(this: CheckboxInterface, options?: CheckboxOptions) {
  const self = this;

  if (!(this instanceof Node)) {
    return new (Checkbox as any)(options);
  }

  options = options || {};

  Input.call(this, options);

  this.text = options.content || options.text || '';
  this.checked = this.value = options.checked || false;

  this.on('keypress', function (ch: string, key: CheckboxKey) {
    if (key.name === 'enter' || key.name === 'space') {
      self.toggle();
      self.screen.render();
    }
  });

  if (options.mouse) {
    this.on('click', function () {
      self.toggle();
      self.screen.render();
    });
  }

  this.on('focus', function () {
    const lpos = self.lpos;
    if (!lpos) return;
    self.screen.program.lsaveCursor('checkbox');
    self.screen.program.cup(lpos.yi, lpos.xi + 1);
    self.screen.program.showCursor();
  });

  this.on('blur', function () {
    self.screen.program.lrestoreCursor('checkbox', true);
  });
}

Checkbox.prototype.__proto__ = Input.prototype;

Checkbox.prototype.type = 'checkbox';

Checkbox.prototype.render = function (this: CheckboxInterface): any {
  this.clearPos(true);
  this.setContent('[' + (this.checked ? 'x' : ' ') + '] ' + this.text, true);
  return this._render();
};

Checkbox.prototype.check = function (this: CheckboxInterface): void {
  if (this.checked) return;
  this.checked = this.value = true;
  this.emit('check');
};

Checkbox.prototype.uncheck = function (this: CheckboxInterface): void {
  if (!this.checked) return;
  this.checked = this.value = false;
  this.emit('uncheck');
};

Checkbox.prototype.toggle = function (this: CheckboxInterface): void {
  return this.checked ? this.uncheck() : this.check();
};

/**
 * Expose
 */

module.exports = Checkbox;
