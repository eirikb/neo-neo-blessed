/**
 * radiobutton.js - radio button element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import Checkbox from './checkbox.js';

/**
 * Type definitions
 */

interface RadioButtonOptions {
  content?: string;
  text?: string;
  checked?: boolean;
  mouse?: boolean;
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
  render(): any;
  toggle(): void;
}

/**
 * RadioButton - Modern ES6 Class
 */

class RadioButton extends Checkbox {
  type = 'radio-button';

  constructor(options?: RadioButtonOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    // Set up radio button group behavior
    this.on('check', () => {
      let el: RadioButtonInterface | undefined = this as any;
      while ((el = el.parent)) {
        if (el.type === 'radio-set' || el.type === 'form') break;
      }
      el = el || this.parent;
      if (el) {
        el.forDescendants((el: RadioButtonInterface) => {
          if (el.type !== 'radio-button' || el === this) {
            return;
          }
          el.uncheck();
        });
      }
    });
  }

  render(): any {
    this.clearPos(true);
    this.setContent('(' + (this.checked ? '*' : ' ') + ') ' + this.text, true);
    return this._render();
  }

  toggle(): void {
    return this.check();
  }
}

/**
 * Factory function for backward compatibility
 */
function radioButton(options?: RadioButtonOptions): RadioButtonInterface {
  return new RadioButton(options) as RadioButtonInterface;
}

// Attach the class as a property for direct access
radioButton.RadioButton = RadioButton;

/**
 * Expose
 */

export default radioButton;
