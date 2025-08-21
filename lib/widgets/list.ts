/**
 * list.js - list element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as helpers from '../helpers.js';
import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;
import scrollableBoxFactory from './scrollablebox.js';
const ScrollableBox = scrollableBoxFactory.ScrollableBox;

/**
 * List - Modern ES6 Class
 */

class List extends ScrollableBox {
  type = 'list';
  value: string;
  items: any[];
  ritems: string[];
  selected: number;
  _isList: boolean;
  interactive: boolean;
  mouse: boolean;
  _listInitialized?: boolean;

  constructor(options?: any) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Force list-specific options
    options.ignoreKeys = true;

    super(options);

    this.value = '';
    this.items = [];
    this.ritems = [];
    this.selected = 0;
    this._isList = true;

    // Set up selected styles
    if (!this.style.selected) {
      this.style.selected = {};
      this.style.selected.bg = options.selectedBg;
      this.style.selected.fg = options.selectedFg;
      this.style.selected.bold = options.selectedBold;
      this.style.selected.underline = options.selectedUnderline;
      this.style.selected.blink = options.selectedBlink;
      this.style.selected.inverse = options.selectedInverse;
      this.style.selected.invisible = options.selectedInvisible;
    }

    // Set up item styles
    if (!this.style.item) {
      this.style.item = {};
      this.style.item.bg = options.itemBg;
      this.style.item.fg = options.itemFg;
      this.style.item.bold = options.itemBold;
      this.style.item.underline = options.itemUnderline;
      this.style.item.blink = options.itemBlink;
      this.style.item.inverse = options.itemInverse;
      this.style.item.invisible = options.itemInvisible;
    }

    // Legacy: for apps written before the addition of item attributes.
    ['bg', 'fg', 'bold', 'underline', 'blink', 'inverse', 'invisible'].forEach(
      (name: string) => {
        if (this.style[name] != null && this.style.item![name] == null) {
          this.style.item![name] = this.style[name];
        }
      }
    );

    // Set up hover and focus effects
    if (this.options.itemHoverBg && !this.options.itemHoverEffects) {
      this.options.itemHoverEffects = { bg: this.options.itemHoverBg };
    }

    if (this.options.itemHoverEffects) {
      this.style.item!.hover = this.options.itemHoverEffects;
    }

    if (this.options.itemFocusEffects) {
      this.style.item!.focus = this.options.itemFocusEffects;
    }

    if (this.options.itemHeight) {
      this.style.item!.height = this.options.itemHeight;
    }

    this.interactive = options.interactive !== false;
    this.mouse = options.mouse || false;

    // Set up mouse interaction
    if (options.mouse) {
      this.screen._listenMouse(this);
      this.on('element wheeldown', () => {
        this.select(this.selected + 2);
        this.screen.render();
      });
      this.on('element wheelup', () => {
        this.select(this.selected - 2);
        this.screen.render();
      });
    }

    // Set up keyboard interaction
    if (options.keys) {
      this.on('keypress', (ch: string, key: any) => {
        if (key.name === 'up' || (options!.vi && key.name === 'k')) {
          this.up();
          this.screen.render();
          return;
        }
        if (key.name === 'down' || (options!.vi && key.name === 'j')) {
          this.down();
          this.screen.render();
          return;
        }
        if (
          key.name === 'enter' ||
          (options!.vi && key.name === 'l' && !key.shift)
        ) {
          this.enterSelected();
          return;
        }
        if (key.name === 'escape' || (options!.vi && key.name === 'q')) {
          this.cancelSelected();
          return;
        }
        if (options!.vi && key.name === 'u' && key.ctrl) {
          this.move(-((this.height - this.iheight) / 2) | 0);
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'd' && key.ctrl) {
          this.move(((this.height - this.iheight) / 2) | 0);
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'b' && key.ctrl) {
          this.move(-(this.height - this.iheight));
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'f' && key.ctrl) {
          this.move(this.height - this.iheight);
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'h' && key.shift) {
          this.move(this.childBase - this.selected);
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'm' && key.shift) {
          const visible =
            (Math.min(this.height - this.iheight, this.items.length) / 2) | 0;
          this.move(this.childBase + visible - this.selected);
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'l' && key.shift) {
          this.down(
            this.childBase +
              Math.min(this.height - this.iheight, this.items.length) -
              this.selected
          );
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'g' && !key.shift) {
          this.select(0);
          this.screen.render();
          return;
        }
        if (options!.vi && key.name === 'g' && key.shift) {
          this.select(this.items.length - 1);
          this.screen.render();
          return;
        }

        if (options!.vi && (key.ch === '/' || key.ch === '?')) {
          if (typeof this.options.search !== 'function') {
            return;
          }
          return this.options.search((err: any, value?: string) => {
            if (
              typeof err === 'string' ||
              typeof err === 'function' ||
              typeof err === 'number' ||
              (err && err.test)
            ) {
              value = err;
              err = null;
            }
            if (err || !value) return this.screen.render();
            this.select(this.fuzzyFind(value, key.ch === '?'));
            this.screen.render();
          });
        }
      });
    }

    // Set up event handlers
    this.on('resize', () => {
      const visible = this.height - this.iheight;
      if (visible >= this.selected + 1) {
        this.childBase = 0;
        this.childOffset = this.selected;
      } else {
        this.childBase = this.selected - visible + 1;
        this.childOffset = visible - 1;
      }
    });

    this.on('adopt', (el: any) => {
      if (!~this.items.indexOf(el)) {
        el.fixed = true;
      }
    });

    this.on('remove', (el: any) => {
      this.removeItem(el);
    });

    // Initialize with items if provided
    if (options.items) {
      options.items.forEach((item: any) => this.add(item));
    }

    this.select(0);
  }

  createItem = (content: string): any => {
    const options: any = {
      screen: this.screen,
      content: content,
      align: this.align || 'left',
      top: 0,
      left: 0,
      right: this.scrollbar ? 1 : 0,
      tags: this.parseTags,
      height: this.style.item.height || 1,
      hoverEffects: this.mouse ? this.style.item.hover : null,
      focusEffects: this.mouse ? this.style.item.focus : null,
      autoFocus: false,
    };

    if (!this.screen.autoPadding) {
      options.top = 1;
      options.left = this.ileft;
      options.right = this.iright + (this.scrollbar ? 1 : 0);
    }

    if (this.shrink && this.options.normalShrink) {
      delete options.right;
      options.width = 'shrink';
    }

    let item: any;
    ['bg', 'fg', 'bold', 'underline', 'blink', 'inverse', 'invisible'].forEach(
      (name: string) => {
        options[name] = () => {
          const attr =
            this.items[this.selected] === item && this.interactive
              ? this.style.selected[name]
              : this.style.item[name];
          if (typeof attr === 'function') return attr(item);
          return attr;
        };
      }
    );

    item = new Box(options);

    if (this.style.transparent) {
      options.transparent = true;
    }

    if (this.mouse) {
      item.on('click', () => {
        this.focus();
        if (this.items[this.selected] === item) {
          this.emit('action', item, this.selected);
          this.emit('select', item, this.selected);
          return;
        }
        this.select(item);
        this.screen.render();
      });
    }

    this.emit('create item');
    return item;
  };

  add = (content: any): any => {
    content = typeof content === 'string' ? content : content.getContent();

    const item = this.createItem(content);
    item.position.top = this.items
      .map(i => i.height)
      .reduce((a, b) => a + b, 0);
    if (!this.screen.autoPadding) {
      item.position.top = this.itop + this.items.length;
    }

    this.ritems.push(content);
    this.items.push(item);
    this.append(item);

    if (this.items.length === 1) {
      this.select(0);
    }

    this.emit('add item');
    return item;
  };

  addItem(content: any): any {
    return this.add(content);
  }

  appendItem(content: any): any {
    return this.add(content);
  }

  removeItem(child: any): any {
    const i = this.getItemIndex(child);
    if (~i && this.items[i]) {
      child = this.items.splice(i, 1)[0];
      this.ritems.splice(i, 1);
      this.remove(child);
      for (let j = i; j < this.items.length; j++) {
        this.items[j].position.top--;
      }
      if (i === this.selected) {
        this.select(i - 1);
      }
    }
    this.emit('remove item');
    return child;
  }

  insertItem(child: any, content: any): void {
    content = typeof content === 'string' ? content : content.getContent();
    const i = this.getItemIndex(child);
    if (!~i) return;
    if (i >= this.items.length) return this.appendItem(content);
    const item = this.createItem(content);
    for (let j = i; j < this.items.length; j++) {
      this.items[j].position.top++;
    }
    item.position.top = i + (!this.screen.autoPadding ? 1 : 0);
    this.ritems.splice(i, 0, content);
    this.items.splice(i, 0, item);
    this.append(item);
    if (i === this.selected) {
      this.select(i + 1);
    }
    this.emit('insert item');
  }

  getItem(child: any): any {
    return this.items[this.getItemIndex(child)];
  }

  setItem(child: any, content: any): void {
    content = typeof content === 'string' ? content : content.getContent();
    const i = this.getItemIndex(child);
    if (!~i) return;
    this.items[i].setContent(content);
    this.ritems[i] = content;
  }

  clearItems(): void {
    return this.setItems([]);
  }

  setItems(items: string[]): void {
    const original = this.items.slice();
    const selected = this.selected;
    const sel = this.ritems[this.selected];
    let i = 0;

    items = items.slice();
    this.select(0);

    for (; i < items.length; i++) {
      if (this.items[i]) {
        this.items[i].setContent(items[i]);
      } else {
        this.add(items[i]);
      }
    }

    for (; i < original.length; i++) {
      this.remove(original[i]);
    }

    this.ritems = items;

    // Try to find our old item if it still exists.
    const newSel = items.indexOf(sel);
    if (~newSel) {
      this.select(newSel);
    } else if (items.length === original.length) {
      this.select(selected);
    } else {
      this.select(Math.min(selected, items.length - 1));
    }

    this.emit('set items');
  }

  pushItem(content: any): number {
    this.appendItem(content);
    return this.items.length;
  }

  popItem(): any {
    return this.removeItem(this.items.length - 1);
  }

  unshiftItem(content: any): number {
    this.insertItem(0, content);
    return this.items.length;
  }

  shiftItem(): any {
    return this.removeItem(0);
  }

  spliceItem(child: any, n: number, ...items: any[]): any[] {
    let i = this.getItemIndex(child);
    if (!~i) return [];
    const removed: any[] = [];
    while (n--) {
      removed.push(this.removeItem(i));
    }
    items.forEach(item => {
      this.insertItem(i++, item);
    });
    return removed;
  }

  find(search: string | RegExp | Function, back?: boolean): number {
    return this.fuzzyFind(search, back);
  }

  fuzzyFind(search: any, back?: boolean): number {
    const start = this.selected + (back ? -1 : 1);
    let i: number;

    if (typeof search === 'number') search += '';

    if (
      search &&
      typeof search === 'string' &&
      search[0] === '/' &&
      search[search.length - 1] === '/'
    ) {
      try {
        search = new RegExp(search.slice(1, -1));
      } catch (e) {}
    }

    const test =
      typeof search === 'string'
        ? (item: string) => {
            return !!~item.indexOf(search as string);
          }
        : (search as any).test
          ? (search as any).test.bind(search)
          : search;

    if (typeof test !== 'function') {
      if (this.screen.options.debug) {
        throw new Error('fuzzyFind(): `test` is not a function.');
      }
      return this.selected;
    }

    if (!back) {
      for (i = start; i < this.ritems.length; i++) {
        if (test(helpers.cleanTags(this.ritems[i]))) return i;
      }
      for (i = 0; i < start; i++) {
        if (test(helpers.cleanTags(this.ritems[i]))) return i;
      }
    } else {
      for (i = start; i >= 0; i--) {
        if (test(helpers.cleanTags(this.ritems[i]))) return i;
      }
      for (i = this.ritems.length - 1; i > start; i--) {
        if (test(helpers.cleanTags(this.ritems[i]))) return i;
      }
    }

    return this.selected;
  }

  getItemIndex(child: any): number {
    if (typeof child === 'number') {
      return child;
    } else if (typeof child === 'string') {
      let i = this.ritems.indexOf(child);
      if (~i) return i;
      for (i = 0; i < this.ritems.length; i++) {
        if (helpers.cleanTags(this.ritems[i]) === child) {
          return i;
        }
      }
      return -1;
    } else {
      return this.items.indexOf(child);
    }
  }

  // Basic scrollTo implementation for list functionality
  scrollTo(offset: number, always?: boolean): any {
    // For now, just a stub implementation
    // This should be replaced with proper scrolling logic
    return;
  }

  select = (index: any): void => {
    if (!this.interactive) {
      return;
    }

    if (!this.items.length) {
      this.selected = 0;
      this.value = '';
      if (this.scrollTo) this.scrollTo(0);
      return;
    }

    if (typeof index === 'object') {
      index = this.items.indexOf(index);
    }

    if (index < 0) {
      index = 0;
    } else if (index >= this.items.length) {
      index = this.items.length - 1;
    }

    if (this.selected === index && this._listInitialized) return;
    this._listInitialized = true;

    this.selected = index;
    this.value = helpers.cleanTags(this.ritems[this.selected]);
    if (!this.parent) return;
    if (this.scrollTo && typeof this.scrollTo === 'function') {
      this.scrollTo(this.selected);
    }

    this.items.forEach((item: any) => {
      if (item.clearPos) {
        item.clearPos();
      }
    });

    this.emit('select item', this.items[this.selected], this.selected);
  };

  move = (offset: number): void => {
    this.select(this.selected + offset);
  };

  up = (offset?: number): void => {
    this.move(-(offset || 1));
  };

  down = (offset?: number): void => {
    this.move(offset || 1);
  };

  pick(label: any, callback?: Function): void {
    if (!callback) {
      callback = label;
      label = null;
    }

    if (!this.interactive) {
      return callback!();
    }

    const focused = this.screen.focused;
    if (focused && (focused as any)._done) (focused as any)._done('stop');
    this.screen.saveFocus();

    this.focus();
    this.show();
    this.select(0);
    if (label) this.setLabel(label);
    this.screen.render();
    this.once('action', (el: any, selected: number) => {
      if (label) this.removeLabel();
      this.screen.restoreFocus();
      this.hide();
      this.screen.render();
      if (!el) return callback!();
      return callback!(null, helpers.cleanTags(this.ritems[selected]));
    });
  }

  enterSelected(i?: number): void {
    if (i != null) this.select(i);
    this.emit('action', this.items[this.selected], this.selected);
    this.emit('select', this.items[this.selected], this.selected);
  }

  cancelSelected(i?: number): void {
    if (i != null) this.select(i);
    this.emit('action');
    this.emit('cancel');
  }
}

/**
 * Factory function for backward compatibility
 */
function list(options?: any): List {
  return new List(options);
}

// Add legacy method aliases to List prototype for backward compatibility
List.prototype.remove = function (index: number) {
  if (typeof index === 'number') {
    const item = this.items[index];
    if (item) {
      this.removeItem(item);
    }
  }
  return this;
};

List.prototype.clear = function () {
  this.clearItems();
  return this;
};

// Attach the class as a property for direct access
list.List = List;

/**
 * Expose
 */

export default list;
