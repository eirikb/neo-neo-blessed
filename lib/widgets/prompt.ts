/**
 * prompt.js - prompt element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Box = require('./box');
const Button = require('./button');
const Textbox = require('./textbox');

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
 * Prompt
 */

function Prompt(this: PromptInterface, options?: PromptOptions) {
  if (!(this instanceof Node)) {
    return new (Prompt as any)(options);
  }

  options = options || {};

  options.hidden = true;

  Box.call(this, options);

  this._.input = new Textbox({
    parent: this,
    top: 3,
    height: 1,
    left: 2,
    right: 2,
    bg: 'black'
  });

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
    mouse: true
  });

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
    mouse: true
  });
}

Prompt.prototype.__proto__ = Box.prototype;

Prompt.prototype.type = 'prompt';

Prompt.prototype.input =
Prompt.prototype.setInput =
Prompt.prototype.readInput = function(this: PromptInterface, text: string, value?: string | PromptCallback, callback?: PromptCallback): void {
  const self = this;
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

  this._.okay.on('press', okay = function() {
    self._.input.submit();
  });

  this._.cancel.on('press', cancel = function() {
    self._.input.cancel();
  });

  this._.input.readInput(function(err: Error | null, data?: string) {
    self.hide();
    self.screen.restoreFocus();
    self._.okay.removeListener('press', okay);
    self._.cancel.removeListener('press', cancel);
    return (callback as PromptCallback)(err, data);
  });

  this.screen.render();
};

/**
 * Expose
 */

module.exports = Prompt;
