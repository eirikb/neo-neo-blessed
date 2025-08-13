/**
 * question.js - question element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Box = require('./box');
const Button = require('./button');

/**
 * Type definitions
 */

interface QuestionOptions {
  hidden?: boolean;
  [key: string]: any;
}

interface QuestionKey {
  name: string;
}

interface QuestionScreen {
  saveFocus(): void;
  restoreFocus(): void;
  render(): void;
}

interface QuestionButton {
  on(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
}

interface QuestionInterface extends Box {
  type: string;
  screen: QuestionScreen;
  _: {
    okay: QuestionButton;
    cancel: QuestionButton;
  };
  show(): void;
  hide(): void;
  focus(): void;
  setContent(text: string): void;
  onScreenEvent(event: string, listener: (...args: any[]) => void): void;
  removeScreenEvent(event: string, listener: (...args: any[]) => void): void;
}

/**
 * Question
 */

function Question(this: QuestionInterface, options?: QuestionOptions) {
  if (!(this instanceof Node)) {
    return new (Question as any)(options);
  }

  options = options || {};
  options.hidden = true;

  Box.call(this, options);

  this._.okay = new Button({
    screen: this.screen,
    parent: this,
    top: 2,
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

  this._.cancel = new Button({
    screen: this.screen,
    parent: this,
    top: 2,
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

Question.prototype.__proto__ = Box.prototype;

Question.prototype.type = 'question';

Question.prototype.ask = function (
  this: QuestionInterface,
  text: string,
  callback: (err: any, data: boolean) => void
): void {
  const self = this;
  let press: (ch: string, key: QuestionKey) => void;
  let okay: () => void;
  let cancel: () => void;

  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.show();
  this.setContent(' ' + text);

  this.onScreenEvent(
    'keypress',
    (press = function (ch: string, key: QuestionKey) {
      if (key.name === 'mouse') return;
      if (
        key.name !== 'enter' &&
        key.name !== 'escape' &&
        key.name !== 'q' &&
        key.name !== 'y' &&
        key.name !== 'n'
      ) {
        return;
      }
      done(null, key.name === 'enter' || key.name === 'y');
    })
  );

  this._.okay.on(
    'press',
    (okay = function () {
      done(null, true);
    })
  );

  this._.cancel.on(
    'press',
    (cancel = function () {
      done(null, false);
    })
  );

  this.screen.saveFocus();
  this.focus();

  function done(err: any, data: boolean) {
    self.hide();
    self.screen.restoreFocus();
    self.removeScreenEvent('keypress', press);
    self._.okay.removeListener('press', okay);
    self._.cancel.removeListener('press', cancel);
    return callback(err, data);
  }

  this.screen.render();
};

/**
 * Expose
 */

module.exports = Question;
