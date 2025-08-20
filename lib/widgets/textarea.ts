/**
 * textarea.js - textarea element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import unicode from '../unicode.js';
import Node from './node.js';
import inputFactory from './input.js';
const Input = inputFactory.Input;
import scrollableTextFactory from './scrollabletext.js';
const ScrollableText = scrollableTextFactory.ScrollableText;

var nextTick = global.setImmediate || process.nextTick.bind(process);

/**
 * Interfaces
 */

export interface TextareaOptions {
  scrollable?: boolean;
  value?: string;
  inputOnFocus?: boolean;
  keys?: boolean;
  vi?: boolean;
  mouse?: boolean;
  [key: string]: any;
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface KeyData {
  name: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
}

interface MouseData {
  button?: string;
  x: number;
  y: number;
}

interface TextareaScreen {
  focused: any;
  program: {
    x: number;
    y: number;
    showCursor(): void;
    hideCursor(): void;
    cuf(n: number): void;
    cub(n: number): void;
    cud(n: number): void;
    cuu(n: number): void;
    cup(y: number, x: number): void;
  };
  grabKeys: boolean;
  fullUnicode: boolean;
  saveFocus(): void;
  restoreFocus(): void;
  rewindFocus(): void;
  render(): void;
  readEditor(options: { value: string }, callback: Function): any;
  _listenKeys(element: any): void;
}

interface TextareaCoords {
  xi: number;
  xl: number;
  yi: number;
  yl: number;
}

interface WrapResult {
  real: string[];
  fake: string[];
  rtof: number[];
  length: number;
}

interface TextareaCLines {
  real: string[];
  fake: string[];
  rtof: number[];
  length: number;
}

interface TextareaInterface extends Input {
  type: string;
  screen: TextareaScreen;
  options: TextareaOptions;
  offsetY: number;
  offsetX: number;
  value: string;
  _value?: string;
  _reading?: boolean;
  _callback?: Function;
  _done?: Function;
  __listener?: Function;
  __done?: Function;
  __updateCursor: Function;
  lpos?: TextareaCoords;
  _clines: TextareaCLines;
  childBase?: number;
  iheight: number;
  itop: number;
  ileft: number;
  iwidth: number;
  width: number;

  // Methods
  getCursor(): CursorPosition;
  setCursor(x: number, y: number): void;
  moveCursor(x: number, y: number): void;
  _updateCursor(get?: boolean): void;
  input(callback?: Function): any;
  setInput(callback?: Function): any;
  readInput(callback?: Function): any;
  _listener(ch: string, key: KeyData): void;
  _typeScroll(): void;
  getValue(): string;
  setValue(value?: string): void;
  clearInput(): any;
  clearValue(): any;
  submit(): any;
  cancel(): any;
  render(): any;
  editor(callback?: Function): any;
  setEditor(callback?: Function): any;
  readEditor(callback?: Function): any;
  _render(): any;
  _getCoords(): TextareaCoords | null;
  strWidth(str: string): number;
  setContent(content: string): void;
  setScroll(offset: number): void;
  _wrapContent(content: string, width: number): WrapResult;
  emit(event: string, ...args: any[]): any;
  on(event: string, listener: Function): void;
  removeListener(event: string, listener: Function): void;
  focus(): void;
}

/**
 * Textarea - Modern ES6 Class
 */

class Textarea extends ScrollableText {
  type = 'textarea';
  offsetY: number;
  offsetX: number;
  value: string;
  _value?: string;
  _reading?: boolean;
  _callback?: Function;
  _done?: Function;
  __listener?: Function;
  __done?: Function;
  __updateCursor: Function;

  constructor(options?: TextareaOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Textarea gets scrollability through ScrollableText inheritance

    super(options);

    this.screen._listenKeys(this);

    this.offsetY = 0;
    this.offsetX = 0;

    this.value = options.value || '';

    // Defer binding until after constructor completes to ensure method is available
    setImmediate(() => {
      if (typeof this._updateCursor === 'function') {
        this.__updateCursor = this._updateCursor.bind(this);
        this.on('resize', this.__updateCursor);
        this.on('move', this.__updateCursor);
      }
    });

    if (options.inputOnFocus) {
      this.on('focus', this.readInput.bind(this, null));
    }

    if (!options.inputOnFocus && options.keys) {
      this.on('keypress', (ch: string, key: KeyData) => {
        if (this._reading) return;
        if (key.name === 'enter' || (options.vi && key.name === 'i')) {
          return this.readInput();
        }
        if (key.name === 'e') {
          return this.readEditor();
        }
      });
    }

    if (options.mouse) {
      this.on('click', (data: MouseData) => {
        if (this._reading) return;
        if (data.button !== 'right') return;
        this.readEditor();
      });
    }
  }

  getCursor(): CursorPosition {
    return { x: this.offsetX, y: this.offsetY };
  }

  setCursor(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  moveCursor(x: number, y: number): void {
    var prevLine = this._clines.length - 1 + this.offsetY;
    let sync = false;
    if (y <= 0 && y > this._clines.length * -1) {
      sync = this.offsetY !== y;
      this.offsetY = y;
    }
    var currentLine = this._clines.length - 1 + this.offsetY;
    var currentText = this._clines[currentLine];

    if (sync) {
      var prevText = this._clines[prevLine];
      var positionFromBegin = Math.max(
        this.strWidth(prevText) + this.offsetX,
        0
      );
      x = Math.max(0, this.strWidth(currentText) - positionFromBegin) * -1;
    }
    if (x <= 0 && x >= this.strWidth(currentText) * -1) {
      this.offsetX = x;
    }
    this._updateCursor(true);
    this.screen.render();
  }

  _updateCursor(get?: boolean): void {
    if (this.screen.focused !== this) {
      return;
    }

    var lpos = get ? this.lpos : this._getCoords();

    if (!lpos) return;

    const currentLine = this._clines.length - 1 + this.offsetY;
    var currentText = this._clines[currentLine],
      program = this.screen.program,
      line,
      cx,
      cy;

    // Stop a situation where the textarea begins scrolling
    // and the last cline appears to always be empty from the
    // _typeScroll `+ '\n'` thing.
    // Maybe not necessary anymore?
    if (currentText === '' && this.value[this.value.length - 1] !== '\n') {
      //currentText = this._clines[currentLine - 1] || '';
    }

    line = Math.min(
      currentLine - (this.childBase || 0),
      lpos.yl - lpos.yi - this.iheight - 1
    );

    // When calling clearValue() on a full textarea with a border, the first
    // argument in the above Math.min call ends up being -2. Make sure we stay
    // positive.
    line = Math.max(0, line);

    cy = lpos.yi + this.itop + line;
    cx = this.offsetX + lpos.xi + this.ileft + this.strWidth(currentText);

    // XXX Not sure, but this may still sometimes
    // cause problems when leaving editor.
    if (cy === program.y && cx === program.x) {
      return;
    }

    if (cy === program.y) {
      if (cx > program.x) {
        program.cuf(cx - program.x);
      } else if (cx < program.x) {
        program.cub(program.x - cx);
      }
    } else if (cx === program.x) {
      if (cy > program.y) {
        program.cud(cy - program.y);
      } else if (cy < program.y) {
        program.cuu(program.y - cy);
      }
    } else {
      program.cup(cy, cx);
    }
  }

  input(callback?: Function): any {
    return this.readInput(callback);
  }

  setInput(callback?: Function): any {
    return this.readInput(callback);
  }

  readInput(callback?: Function): any {
    var focused = this.screen.focused === this;

    if (this._reading) return;
    this._reading = true;

    this._callback = callback;

    if (!focused) {
      this.screen.saveFocus();
      this.focus();
    }

    this.screen.grabKeys = true;

    this._updateCursor();
    this.screen.program.showCursor();
    //this.screen.program.sgr('normal');

    this._done = (err?: any, value?: string) => {
      if (!this._reading) return;

      if ((this._done as any).done) return;
      (this._done as any).done = true;

      this._reading = false;

      delete this._callback;
      delete this._done;

      this.removeListener('keypress', this.__listener);
      delete this.__listener;

      this.removeListener('blur', this.__done);
      delete this.__done;

      this.screen.program.hideCursor();
      this.screen.grabKeys = false;

      if (!focused) {
        this.screen.restoreFocus();
      }

      if (this.options.inputOnFocus) {
        this.screen.rewindFocus();
      }

      // Ugly
      if (err === 'stop') return;

      if (err) {
        this.emit('error', err);
      } else if (value != null) {
        this.emit('submit', value);
      } else {
        this.emit('cancel', value);
      }
      this.emit('action', value);

      if (!callback) return;

      return err ? callback(err) : callback(null, value);
    };

    // Put this in a nextTick so the current
    // key event doesn't trigger any keys input.
    nextTick(() => {
      this.__listener = this._listener.bind(this);
      this.on('keypress', this.__listener);
    });

    this.__done = this._done.bind(this, null, null);
    this.on('blur', this.__done);
  }

  _listener(ch: string, key: KeyData): void {
    var done = this._done,
      value = this.value;

    if (key.name === 'return') return;
    if (key.name === 'enter') {
      ch = '\n';
    }
    const cursor = this.getCursor();

    // TODO: Handle directional keys.
    if (
      key.name === 'left' ||
      key.name === 'right' ||
      key.name === 'up' ||
      key.name === 'down' ||
      key.name === 'end' ||
      key.name === 'home'
    ) {
      if (key.name === 'left') {
        cursor.x--;
      } else if (key.name === 'right') {
        cursor.x++;
      }
      if (key.name === 'up') {
        cursor.y--;
      } else if (key.name === 'down') {
        cursor.y++;
      }

      if (key.name === 'end') {
        cursor.x = 0;
      } else if (key.name === 'home') {
        const currentLine = this._clines.length - 1 + this.offsetY;
        const currentLineLength = this.strWidth(
          this._clines[currentLine] ?? ''
        );
        cursor.x = -currentLineLength;
      }

      this.moveCursor(cursor.x, cursor.y);
    }

    if (this.options.keys && key.ctrl && key.name === 'e') {
      return this.readEditor();
    }

    // TODO: Optimize typing by writing directly
    // to the screen and screen buffer here.
    if (key.name === 'escape') {
      done(null, null);
    } else if (key.name === 'backspace') {
      if (this.value.length) {
        if (this.screen.fullUnicode) {
        } else {
          if (cursor.x === 0 && cursor.y === 0) {
            this.value = this.value.slice(0, -1);
          } else {
            const realLines = this._clines.real.slice();
            const fakeLines = this._clines.fake.slice();
            const mapper = this._clines.rtof;

            const currentLine = realLines.length - 1 + cursor.y;

            const fakeLineIndex = mapper[currentLine];

            let fakeCursorPosition = 0;
            for (let i = 0; i <= currentLine; i++) {
              if (mapper[i] === fakeLineIndex) {
                fakeCursorPosition += this.strWidth(realLines[i]);
              }
            }
            fakeCursorPosition += cursor.x;

            let realCursorPosition =
              this.strWidth(realLines[currentLine]) + cursor.x;

            if (fakeLines[fakeLineIndex] === '') {
              fakeLines.splice(fakeLineIndex, 1);
            } else if (cursor.x === -this.strWidth(realLines[currentLine])) {
              if (currentLine > 0) {
                const lineLengthBefore = this.strWidth(
                  realLines[currentLine - 1] ?? ''
                );

                if (mapper[currentLine] !== mapper[currentLine - 1]) {
                  const currentLineString = fakeLines.splice(fakeLineIndex, 1);
                  fakeLines[fakeLineIndex - 1] += currentLineString;
                } else {
                }

                const predict = this._wrapContent(
                  fakeLines.join('\n'),
                  this.width - this.iwidth
                );

                cursor.x = -(
                  this.strWidth(predict[currentLine - 1] ?? '') -
                  lineLengthBefore
                );
                if (predict.real.length === realLines.length) {
                  cursor.y--;
                }
              }
            } else {
              fakeLines[fakeLineIndex] =
                fakeLines[fakeLineIndex].slice(0, fakeCursorPosition - 1) +
                fakeLines[fakeLineIndex].slice(fakeCursorPosition);
              const predict = this._wrapContent(
                fakeLines.join('\n'),
                this.width - this.iwidth
              );
              cursor.x = -(
                this.strWidth(predict.real[currentLine]) -
                realCursorPosition +
                1
              );
              if (predict.real.length !== realLines.length) {
                cursor.y++;
              }
            }
            this.value = fakeLines.join('\n');
            this.setCursor(cursor.x, cursor.y);
          }
        }
      }
    } else if (key.name === 'delete') {
      if (this.value.length) {
        if (this.screen.fullUnicode) {
        } else {
          const currentLine = this._clines.length - 1 + cursor.y;
          if (cursor.x === 0 && cursor.y === 0) {
          } else {
            const realLines = this._clines.real.slice();
            const fakeLines = this._clines.fake.slice();
            const mapper = this._clines.rtof;

            const currentLine = realLines.length - 1 + cursor.y;

            const fakeLineIndex = mapper[currentLine];

            let fakeCursorPosition = 0;
            for (let i = 0; i <= currentLine; i++) {
              if (mapper[i] === fakeLineIndex) {
                fakeCursorPosition += this.strWidth(realLines[i]);
              }
            }
            fakeCursorPosition += cursor.x;

            let realCursorPosition =
              this.strWidth(realLines[currentLine]) + cursor.x;

            if (fakeLines[fakeLineIndex] === '') {
              const nextLineLength = this.strWidth(
                fakeLines[fakeLineIndex + 1] ?? ''
              );
              fakeLines.splice(fakeLineIndex, 1);
              cursor.y++;
              cursor.x = -nextLineLength;
            } else {
              if (fakeLineIndex < fakeLines.length - 1) {
                if (cursor.x === -this.strWidth(realLines[currentLine])) {
                  fakeLines[fakeLineIndex] =
                    fakeLines[fakeLineIndex].substring(1);
                } else {
                  fakeLines[fakeLineIndex] =
                    fakeLines[fakeLineIndex].slice(0, fakeCursorPosition) +
                    fakeLines[fakeLineIndex].slice(fakeCursorPosition + 1);
                }
                const predict = this._wrapContent(
                  fakeLines.join('\n'),
                  this.width - this.iwidth
                );
                cursor.x = -(
                  this.strWidth(predict.real[currentLine]) - realCursorPosition
                );
                if (predict.real.length !== realLines.length) {
                  cursor.y++;
                }
              }
            }
            this.value = fakeLines.join('\n');
            this.setCursor(cursor.x, cursor.y);
          }
        }
      }
    } else if (ch) {
      if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
        if (cursor.x === 0 && cursor.y === 0) {
          this.value += ch;
        } else if (cursor.x >= this.value.length * -1) {
          const realLines = this._clines.real.slice();
          const fakeLines = this._clines.fake.slice();
          const mapper = this._clines.rtof;

          const currentLine = realLines.length - 1 + cursor.y;

          const fakeLineIndex = mapper[currentLine];
          let fakeCursorPosition = 0;
          for (let i = 0; i <= currentLine; i++) {
            if (mapper[i] === fakeLineIndex) {
              fakeCursorPosition += this.strWidth(realLines[i]);
            }
          }
          fakeCursorPosition += cursor.x;

          fakeLines[fakeLineIndex] =
            fakeLines[fakeLineIndex].slice(0, fakeCursorPosition) +
            ch +
            fakeLines[fakeLineIndex].slice(fakeCursorPosition);

          const predict = this._wrapContent(
            fakeLines.join('\n'),
            this.width - this.iwidth
          );
          if (ch === '\n') {
            if (predict.real.length === realLines.length) {
              cursor.y++;
            }
            cursor.x = -this.strWidth(predict[predict.length - 1 + cursor.y]);
          }

          this.value = fakeLines.join('\n');
          this.setCursor(cursor.x, cursor.y);
        }
      }
    }

    if (this.value !== value) {
      this.screen.render();
    }
  }

  _typeScroll(): void {
    // XXX Workaround
    //var height = this.height - this.iheight;
    //if (this._clines.length - this.childBase > height) {
    const currentLine = this._clines.length - 1 + this.offsetY;
    this.setScroll(currentLine);
    //}
  }

  getValue(): string {
    return this.value;
  }

  setValue(value?: string): void {
    if (value == null) {
      value = this.value;
    }
    if (this._value !== value) {
      this.value = value;
      this._value = value;
      this.setContent(this.value);
      this._typeScroll();
      this._updateCursor();
    }
  }

  clearInput(): any {
    return this.setValue('');
  }

  clearValue(): any {
    return this.setValue('');
  }

  submit(): any {
    if (!this.__listener) return;
    return this.__listener('\x1b', { name: 'escape' });
  }

  cancel(): any {
    if (!this.__listener) return;
    return this.__listener('\x1b', { name: 'escape' });
  }

  render(): any {
    this.setValue();
    return this._render();
  }

  editor(callback?: Function): any {
    return this.readEditor(callback);
  }

  setEditor(callback?: Function): any {
    return this.readEditor(callback);
  }

  readEditor(callback?: Function): any {
    if (this._reading) {
      var _cb = this._callback,
        cb = callback;

      this._done('stop');

      callback = function (err?: any, value?: string) {
        if (_cb) _cb(err, value);
        if (cb) cb(err, value);
      };
    }

    if (!callback) {
      callback = function () {};
    }

    return this.screen.readEditor(
      { value: this.value },
      (err?: any, value?: string) => {
        if (err) {
          if (err.message === 'Unsuccessful.') {
            this.screen.render();
            return this.readInput(callback);
          }
          this.screen.render();
          this.readInput(callback);
          return callback(err);
        }
        this.setValue(value);
        this.screen.render();
        return callback(null, value);
      }
    );
  }
}

/**
 * Factory function for backward compatibility
 */
function textarea(options?: TextareaOptions): TextareaInterface {
  return new Textarea(options) as TextareaInterface;
}

// Attach the class as a property for direct access
textarea.Textarea = Textarea;

/**
 * Expose
 */

export default textarea;
