/**
 * prompt.js - prompt element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;
import buttonFactory from './button.js';
const Button = buttonFactory.Button;
import textboxFactory from './textbox.js';
const Textbox = textboxFactory.Textbox;

/**
 * Type definitions
 */

interface PromptOptions {
  hidden?: boolean;
  [key: string]: any;
}

interface PromptCallback {
  (err: Error | null, data?: string): void;
}

interface PromptButton {
  on(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
}

interface PromptTextbox {
  value: string;
  submit(): void;
  cancel(): void;
  readInput(callback: PromptCallback): void;
}

interface PromptScreen {
  saveFocus(): void;
  restoreFocus(): void;
  render(): void;
}

interface PromptInterface extends Box {
  type: string;
  _: {
    input: PromptTextbox;
    okay: PromptButton;
    cancel: PromptButton;
  };
  screen: PromptScreen;
  show(): void;
  hide(): void;
  setContent(content: string): void;
  input(text: string, value: string, callback: PromptCallback): void;
  input(text: string, callback: PromptCallback): void;
  setInput(text: string, value: string, callback: PromptCallback): void;
  setInput(text: string, callback: PromptCallback): void;
  readInput(text: string, value: string, callback: PromptCallback): void;
  readInput(text: string, callback: PromptCallback): void;
}

/**
 * Prompt - Modern ES6 Class
 */

class Prompt extends Box {
  type = 'prompt';
  _: {
    input: PromptTextbox;
    okay: PromptButton;
    cancel: PromptButton;
  };

  constructor(options?: PromptOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Force hidden to true for modal behavior
    options.hidden = true;

    super(options);

    // Initialize the internal objects container
    this._ = {} as any;

    // Create input textbox
    this._.input = new Textbox({
      parent: this,
      top: 3,
      height: 1,
      left: 2,
      right: 2,
      bg: 'black',
    });

    // Create okay button
    this._.okay = new Button({
      parent: this,
      top: 5,
      height: 1,
      left: 2,
      width: 6,
      content: 'Okay',
      align: 'center',
      bg: 'black',
      hoverBg: 'blue',
      autoFocus: false,
      mouse: true,
    });

    // Create cancel button
    this._.cancel = new Button({
      parent: this,
      top: 5,
      height: 1,
      shrink: true,
      left: 10,
      width: 8,
      content: 'Cancel',
      align: 'center',
      bg: 'black',
      hoverBg: 'blue',
      autoFocus: false,
      mouse: true,
    });
  }

  input(text: string, value: string, callback: PromptCallback): void;
  input(text: string, callback: PromptCallback): void;
  input(
    text: string,
    value?: string | PromptCallback,
    callback?: PromptCallback
  ): void {
    let okay: () => void, cancel: () => void;

    if (!callback) {
      callback = value as PromptCallback;
      value = '';
    }

    // Keep above:
    // var parent = this.parent;
    // this.detach();
    // parent.append(this);

    this.show();
    this.setContent(' ' + text);

    this._.input.value = value as string;

    this.screen.saveFocus();

    this._.okay.on(
      'press',
      (okay = () => {
        this._.input.submit();
      })
    );

    this._.cancel.on(
      'press',
      (cancel = () => {
        this._.input.cancel();
      })
    );

    this._.input.readInput((err: Error | null, data?: string) => {
      this.hide();
      this.screen.restoreFocus();
      this._.okay.removeListener('press', okay);
      this._.cancel.removeListener('press', cancel);
      return (callback as PromptCallback)(err, data);
    });

    this.screen.render();
  }

  setInput(text: string, value: string, callback: PromptCallback): void;
  setInput(text: string, callback: PromptCallback): void;
  setInput(
    text: string,
    value?: string | PromptCallback,
    callback?: PromptCallback
  ): void {
    return this.input(text, value as any, callback);
  }

  readInput(text: string, value: string, callback: PromptCallback): void;
  readInput(text: string, callback: PromptCallback): void;
  readInput(
    text: string,
    value?: string | PromptCallback,
    callback?: PromptCallback
  ): void {
    return this.input(text, value as any, callback);
  }
}

/**
 * Factory function for backward compatibility
 */
function prompt(options?: PromptOptions): PromptInterface {
  return new Prompt(options) as PromptInterface;
}

// Attach the class as a property for direct access
prompt.Prompt = Prompt;

/**
 * Expose
 */

export default prompt;
