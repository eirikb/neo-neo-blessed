/**
 * checkbox.js - checkbox element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import inputFactory from './input.js';
const Input = inputFactory.Input;

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
 * Checkbox - Modern ES6 Class
 */

class Checkbox extends Input {
  type = 'checkbox';
  text: string;
  checked: boolean;
  value: boolean;

  constructor(options?: CheckboxOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    this.text = options.content || options.text || '';
    this.checked = this.value = options.checked || false;

    // Set up keyboard interaction
    this.on('keypress', (ch: string, key: CheckboxKey) => {
      if (key.name === 'enter' || key.name === 'space') {
        this.toggle();
        this.screen.render();
      }
    });

    // Set up mouse interaction if enabled
    if (options.mouse) {
      this.on('click', () => {
        this.toggle();
        this.screen.render();
      });
    }

    // Set up focus/blur cursor handling
    this.on('focus', () => {
      const lpos = this.lpos;
      if (!lpos) return;
      this.screen.program.lsaveCursor('checkbox');
      this.screen.program.cup(lpos.yi, lpos.xi + 1);
      this.screen.program.showCursor();
    });

    this.on('blur', () => {
      this.screen.program.lrestoreCursor('checkbox', true);
    });
  }

  render(): any {
    this.clearPos(true);
    this.setContent('[' + (this.checked ? 'x' : ' ') + '] ' + this.text, true);
    return this._render();
  }

  check(): void {
    if (this.checked) return;
    this.checked = this.value = true;
    this.emit('check');
  }

  uncheck(): void {
    if (!this.checked) return;
    this.checked = this.value = false;
    this.emit('uncheck');
  }

  toggle(): void {
    return this.checked ? this.uncheck() : this.check();
  }
}

/**
 * Factory function for backward compatibility
 */
function checkbox(options?: CheckboxOptions): CheckboxInterface {
  return new Checkbox(options) as CheckboxInterface;
}

// Attach the class as a property for direct access
checkbox.Checkbox = Checkbox;

/**
 * Expose
 */

export default checkbox;
