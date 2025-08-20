/**
 * textbox.js - textbox element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import textareaFactory from './textarea.js';
const Textarea = textareaFactory.Textarea;

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
 * Textbox - Modern ES6 Class
 */

class Textbox extends Textarea {
  type = 'textbox';
  secret?: boolean;
  censor?: boolean;
  __olistener: (ch: string, key: TextboxKey) => any;

  constructor(options?: TextboxOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Force scrollable to false for textbox (single-line input)
    options.scrollable = false;

    super(options);

    this.secret = options.secret;
    this.censor = options.censor;

    // Store original listener and override with textbox-specific behavior
    // Defer binding until after constructor completes to ensure methods are available
    setImmediate(() => {
      if (typeof this._listener === 'function') {
        this.__olistener = this._listener.bind(this);
        this._listener = this._textboxListener.bind(this);
      }
    });
  }

  _textboxListener(ch: string, key: TextboxKey): any {
    if (key.name === 'enter') {
      this._done(null, this.value);
      return;
    }
    return this.__olistener(ch, key);
  }

  setValue(value?: string): void {
    let visible: number, val: string;
    if (value == null) {
      value = this.value;
    }
    if (this._value !== value) {
      // Remove newlines for single-line textbox
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
  }

  submit(): any {
    if (!this.__listener) return;
    return this.__listener('\r', { name: 'enter' });
  }
}

/**
 * Factory function for backward compatibility
 */
function textbox(options?: TextboxOptions): TextboxInterface {
  return new Textbox(options) as TextboxInterface;
}

// Attach the class as a property for direct access
textbox.Textbox = Textbox;

/**
 * Expose
 */

export default textbox;
