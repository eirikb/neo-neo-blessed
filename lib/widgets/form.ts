/**
 * form.js - form element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;

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
 * Form - Modern ES6 Class
 */

class Form extends Box {
  type = 'form';
  _children?: FormElement[];
  _selected?: FormElement | null = null;
  submission?: FormSubmission;

  constructor(options?: FormOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Force ignoreKeys to true for forms
    options.ignoreKeys = true;
    // Disable ScrollableBox mixin to avoid circular dependency issues
    options.scrollable = false;

    super(options);

    // Set up key handling if requested
    if (options.keys && this.screen) {
      this.screen._listenKeys(this);
      this.on(
        'element keypress',
        (el: FormElement, ch: string, key: FormKey) => {
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
            this.focusNext();
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
            this.focusPrevious();
            return;
          }

          if (key.name === 'escape') {
            this.focus();
            return;
          }
        }
      );
    }
  }

  _refresh(): void {
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
  }

  _visible(): boolean {
    return !!this._children!.filter(function (el: FormElement) {
      return el.visible;
    }).length;
  }

  next(): FormElement | undefined {
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
  }

  previous(): FormElement | undefined {
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
  }

  focusNext(): void {
    const next = this.next();
    if (next) next.focus();
  }

  focusPrevious(): void {
    const previous = this.previous();
    if (previous) previous.focus();
  }

  resetSelected(): void {
    this._selected = null;
  }

  focusFirst(): void {
    this.resetSelected();
    this.focusNext();
  }

  focusLast(): void {
    this.resetSelected();
    this.focusPrevious();
  }

  submit(): FormSubmission {
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
  }

  cancel(): void {
    this.emit('cancel');
  }

  reset(): void {
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
  }
}

/**
 * Factory function for backward compatibility
 */
function form(options?: FormOptions): FormInterface {
  return new Form(options) as FormInterface;
}

// Attach the class as a property for direct access
form.Form = Form;

/**
 * Expose
 */

export default form;
