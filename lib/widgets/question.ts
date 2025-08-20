/**
 * question.js - question element for blessed
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
  ask(text: string, callback: (err: any, data: boolean) => void): void;
}

/**
 * Question - Modern ES6 Class
 */

class Question extends Box {
  type = 'question';
  _: {
    okay: QuestionButton;
    cancel: QuestionButton;
  };

  constructor(options?: QuestionOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Set default hidden behavior for questions
    options.hidden = true;

    super(options);

    // Initialize the internal button container
    this._ = {} as any;

    // Create OK button
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

    // Create Cancel button
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

  ask(text: string, callback: (err: any, data: boolean) => void): void {
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
  }
}

/**
 * Factory function for backward compatibility
 */
function question(options?: QuestionOptions): QuestionInterface {
  return new Question(options) as QuestionInterface;
}

// Attach the class as a property for direct access
question.Question = Question;

/**
 * Expose
 */

export default question;
