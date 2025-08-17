/**
 * button.js - button element for blessed
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

interface ButtonOptions {
  autoFocus?: boolean;
  mouse?: boolean;
  [key: string]: any;
}

interface ButtonKey {
  name: string;
}

interface ButtonInterface {
  type: string;
  options: ButtonOptions;
  value?: boolean;
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  focus(): void;
  press(): boolean;
  [key: string]: any;
}

/**
 * Button - Modern ES6 Class
 */

class Button extends Input {
  type = 'button';
  value?: boolean;

  constructor(options?: ButtonOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Set default autoFocus behavior
    if (options.autoFocus == null) {
      options.autoFocus = false;
    }

    super(options);

    // Set up keypress handler for enter and space keys
    this.on('keypress', (ch: string, key: ButtonKey) => {
      if (key.name === 'enter' || key.name === 'space') {
        return this.press();
      }
    });

    // Set up mouse click handler if mouse is enabled
    if (this.options.mouse) {
      this.on('click', () => {
        return this.press();
      });
    }
  }

  press(): boolean {
    this.focus();
    this.value = true;
    const result = this.emit('press');
    delete this.value;
    return result;
  }
}

/**
 * Factory function for backward compatibility
 */
function button(options?: ButtonOptions): ButtonInterface {
  return new Button(options) as ButtonInterface;
}

// Attach the class as a property for direct access
button.Button = Button;

/**
 * Expose
 */

export default button;
