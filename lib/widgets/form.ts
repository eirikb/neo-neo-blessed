/**
 * form.js - form element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Box = require('./box');

/**
 * Type definitions
 */

interface FormOptions {
  keys?: boolean;
  autoNext?: boolean;
  vi?: boolean;
  ignoreKeys?: boolean;
  [key: string]: any;
}

interface FormKey {
  name: string;
  shift?: boolean;
}

interface FormElement {
  type: string;
  name?: string;
  value?: any;
  keyable?: boolean;
  visible: boolean;
  children: FormElement[];
  emit(event: string, ...args: any[]): boolean;
  focus(): void;
  select?: (index: number) => void;
  clearInput?: () => void;
  setProgress?: (progress: number) => void;
  refresh?: (cwd: string) => void;
  uncheck?: () => void;
  write?: (data: string) => void;
  options?: { cwd?: string };
}

interface FormScreen {
  focused: FormElement | null;
  _listenKeys(form: FormInterface): void;
}

interface FormSubmission {
  [key: string]: any;
}

interface FormInterface extends Box {
  type: string;
  screen: FormScreen;
  children: FormElement[];
  _children?: FormElement[];
  _selected?: FormElement | null;
  submission?: FormSubmission;
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  focus(): void;
  _refresh(): void;
  _visible(): boolean;
  next(): FormElement | undefined;
  previous(): FormElement | undefined;
  focusNext(): void;
  focusPrevious(): void;
  resetSelected(): void;
  focusFirst(): void;
  focusLast(): void;
  submit(): FormSubmission;
  cancel(): void;
  reset(): void;
}

/**
 * Form
 */

function Form(this: FormInterface, options?: FormOptions) {
  const self = this;

  if (!(this instanceof Node)) {
    return new (Form as any)(options);
  }

  options = options || {};

  options.ignoreKeys = true;
  Box.call(this, options);

  if (options.keys) {
    this.screen._listenKeys(this);
    this.on(
      'element keypress',
      function (el: FormElement, ch: string, key: FormKey) {
        if (
          (key.name === 'tab' && !key.shift) ||
          (el.type === 'textbox' &&
            options!.autoNext &&
            key.name === 'enter') ||
          key.name === 'down' ||
          (options!.vi && key.name === 'j')
        ) {
          if (el.type === 'textbox' || el.type === 'textarea') {
            if (key.name === 'j') return;
            if (key.name === 'tab') {
              // Workaround, since we can't stop the tab from being added.
              el.emit('keypress', null, { name: 'backspace' });
            }
            el.emit('keypress', '\x1b', { name: 'escape' });
          }
          self.focusNext();
          return;
        }

        if (
          (key.name === 'tab' && key.shift) ||
          key.name === 'up' ||
          (options!.vi && key.name === 'k')
        ) {
          if (el.type === 'textbox' || el.type === 'textarea') {
            if (key.name === 'k') return;
            el.emit('keypress', '\x1b', { name: 'escape' });
          }
          self.focusPrevious();
          return;
        }

        if (key.name === 'escape') {
          self.focus();
          return;
        }
      }
    );
  }
}

Form.prototype.__proto__ = Box.prototype;

Form.prototype.type = 'form';

Form.prototype._refresh = function (this: FormInterface): void {
  // XXX Possibly remove this if statement and refresh on every focus.
  // Also potentially only include *visible* focusable elements.
  // This would remove the need to check for _selected.visible in previous()
  // and next().
  if (!this._children) {
    const out: FormElement[] = [];

    this.children.forEach(function fn(el: FormElement) {
      if (el.keyable) out.push(el);
      el.children.forEach(fn);
    });

    this._children = out;
  }
};

Form.prototype._visible = function (this: FormInterface): boolean {
  return !!this._children!.filter(function (el: FormElement) {
    return el.visible;
  }).length;
};

Form.prototype.next = function (this: FormInterface): FormElement | undefined {
  this._refresh();

  if (!this._visible()) return;

  if (!this._selected) {
    this._selected = this._children![0];
    if (!this._selected.visible) return this.next();
    if (this.screen.focused !== this._selected) return this._selected;
  }

  const i = this._children!.indexOf(this._selected);
  if (!~i || !this._children![i + 1]) {
    this._selected = this._children![0];
    if (!this._selected.visible) return this.next();
    return this._selected;
  }

  this._selected = this._children![i + 1];
  if (!this._selected.visible) return this.next();
  return this._selected;
};

Form.prototype.previous = function (
  this: FormInterface
): FormElement | undefined {
  this._refresh();

  if (!this._visible()) return;

  if (!this._selected) {
    this._selected = this._children![this._children!.length - 1];
    if (!this._selected.visible) return this.previous();
    if (this.screen.focused !== this._selected) return this._selected;
  }

  const i = this._children!.indexOf(this._selected);
  if (!~i || !this._children![i - 1]) {
    this._selected = this._children![this._children!.length - 1];
    if (!this._selected.visible) return this.previous();
    return this._selected;
  }

  this._selected = this._children![i - 1];
  if (!this._selected.visible) return this.previous();
  return this._selected;
};

Form.prototype.focusNext = function (this: FormInterface): void {
  const next = this.next();
  if (next) next.focus();
};

Form.prototype.focusPrevious = function (this: FormInterface): void {
  const previous = this.previous();
  if (previous) previous.focus();
};

Form.prototype.resetSelected = function (this: FormInterface): void {
  this._selected = null;
};

Form.prototype.focusFirst = function (this: FormInterface): void {
  this.resetSelected();
  this.focusNext();
};

Form.prototype.focusLast = function (this: FormInterface): void {
  this.resetSelected();
  this.focusPrevious();
};

Form.prototype.submit = function (this: FormInterface): FormSubmission {
  const out: FormSubmission = {};

  this.children.forEach(function fn(el: FormElement) {
    if (el.value != null) {
      const name = el.name || el.type;
      if (Array.isArray(out[name])) {
        out[name].push(el.value);
      } else if (out[name]) {
        out[name] = [out[name], el.value];
      } else {
        out[name] = el.value;
      }
    }
    el.children.forEach(fn);
  });

  this.emit('submit', out);

  return (this.submission = out);
};

Form.prototype.cancel = function (this: FormInterface): void {
  this.emit('cancel');
};

Form.prototype.reset = function (this: FormInterface): void {
  this.children.forEach(function fn(el: FormElement) {
    switch (el.type) {
      case 'screen':
        break;
      case 'box':
        break;
      case 'text':
        break;
      case 'line':
        break;
      case 'scrollable-box':
        break;
      case 'list':
        el.select!(0);
        return;
      case 'form':
        break;
      case 'input':
        break;
      case 'textbox':
        el.clearInput!();
        return;
      case 'textarea':
        el.clearInput!();
        return;
      case 'button':
        delete el.value;
        break;
      case 'progress-bar':
        el.setProgress!(0);
        break;
      case 'file-manager':
        el.refresh!(el.options!.cwd!);
        return;
      case 'checkbox':
        el.uncheck!();
        return;
      case 'radio-set':
        break;
      case 'radio-button':
        el.uncheck!();
        return;
      case 'prompt':
        break;
      case 'question':
        break;
      case 'message':
        break;
      case 'info':
        break;
      case 'loading':
        break;
      case 'list-bar':
        //el.select(0);
        break;
      case 'dir-manager':
        el.refresh!(el.options!.cwd!);
        return;
      case 'terminal':
        el.write!('');
        return;
      case 'image':
        //el.clearImage();
        return;
    }
    el.children.forEach(fn);
  });

  this.emit('reset');
};

/**
 * Expose
 */

module.exports = Form;
