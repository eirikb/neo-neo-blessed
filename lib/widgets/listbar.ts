/**
 * listbar.js - listbar element for blessed
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

/**
 * Type definitions
 */

interface ListbarOptions {
  mouse?: boolean;
  commands?: ListbarCommand[] | { [key: string]: ListbarCommand | Function };
  items?: ListbarCommand[] | { [key: string]: ListbarCommand | Function };
  keys?: boolean;
  vi?: boolean;
  autoCommandKeys?: boolean;
  [key: string]: any;
}

interface ListbarCommand {
  text?: string;
  prefix?: string;
  callback?: Function;
  keys?: string[];
}

interface ListbarKey {
  name: string;
  shift?: boolean;
}

interface ListbarStyle {
  selected?: { [key: string]: any };
  item?: { [key: string]: any };
  prefix?: { [key: string]: any };
  [key: string]: any;
}

interface ListbarCoords {
  xi: number;
  xl: number;
  yi: number;
  yl: number;
}

interface ListbarElement {
  aleft?: number;
  width: number;
  hide(): void;
  show(): void;
  rleft?: number;
  _?: { cmd: ListbarCommand };
  _getCoords(): ListbarCoords | undefined;
  detach(): void;
  on(event: string, listener: Function): void;
}

interface ListbarScreen {
  autoPadding?: boolean;
  render(): void;
  key(keys: string[], callback: Function): void;
}

interface ListbarInterface extends Box {
  type: string;
  items: ListbarElement[];
  ritems: string[];
  commands: ListbarCommand[];
  leftBase: number;
  leftOffset: number;
  mouse: boolean;
  style: ListbarStyle;
  screen: ListbarScreen;
  parent?: any;
  ileft: number;
  itop: number;
  iwidth: number;
  _: { [key: string]: any };
  selected: number;
  on(event: string, listener: Function): void;
  emit(event: string, ...args: any[]): boolean;
  onScreenEvent(event: string, listener: Function): void;
  append(element: any): void;
  remove(element: any): void;
  _getCoords(): ListbarCoords | undefined;
  _render(): any;
  setItems(
    commands: ListbarCommand[] | { [key: string]: ListbarCommand | Function }
  ): void;
  add(item: string | Function | ListbarCommand, callback?: Function): void;
  addItem(item: string | Function | ListbarCommand, callback?: Function): void;
  appendItem(
    item: string | Function | ListbarCommand,
    callback?: Function
  ): void;
  render(): any;
  select(offset: number | ListbarElement): void;
  removeItem(child: number | ListbarElement): void;
  move(offset: number): void;
  moveLeft(offset?: number): void;
  moveRight(offset?: number): void;
  selectTab(index: number): void;
}

/**
 * Listbar / HorizontalList - Modern ES6 Class
 */

class Listbar extends Box {
  type = 'listbar';
  items: ListbarElement[];
  ritems: string[];
  commands: ListbarCommand[];
  leftBase: number;
  leftOffset: number;
  mouse: boolean;

  constructor(options?: ListbarOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    this.items = [];
    this.ritems = [];
    this.commands = [];

    this.leftBase = 0;
    this.leftOffset = 0;

    this.mouse = options.mouse || false;

    if (!this.style.selected) {
      this.style.selected = {};
    }

    if (!this.style.item) {
      this.style.item = {};
    }

    if (options.commands || options.items) {
      this.setItems(options.commands || options.items);
    }

    if (options.keys) {
      this.on('keypress', (ch: string, key: ListbarKey) => {
        if (
          key.name === 'left' ||
          (options!.vi && key.name === 'h') ||
          (key.shift && key.name === 'tab')
        ) {
          this.moveLeft();
          this.screen.render();
          // Stop propagation if we're in a form.
          if (key.name === 'tab') return false;
          return;
        }
        if (
          key.name === 'right' ||
          (options!.vi && key.name === 'l') ||
          key.name === 'tab'
        ) {
          this.moveRight();
          this.screen.render();
          // Stop propagation if we're in a form.
          if (key.name === 'tab') return false;
          return;
        }
        if (
          key.name === 'enter' ||
          (options!.vi && key.name === 'k' && !key.shift)
        ) {
          this.emit('action', this.items[this.selected], this.selected);
          this.emit('select', this.items[this.selected], this.selected);
          const item = this.items[this.selected];
          if (item._!.cmd.callback) {
            item._!.cmd.callback();
          }
          this.screen.render();
          return;
        }
        if (key.name === 'escape' || (options!.vi && key.name === 'q')) {
          this.emit('action');
          this.emit('cancel');
          return;
        }
      });
    }

    if (options.autoCommandKeys) {
      this.onScreenEvent('keypress', (ch: string) => {
        if (/^[0-9]$/.test(ch)) {
          let i = +ch - 1;
          if (!~i) i = 9;
          return this.selectTab(i);
        }
      });
    }

    this.on('focus', () => {
      this.select(this.selected);
    });
  }

  get selected(): number {
    return this.leftBase + this.leftOffset;
  }

  setItems(
    commands: ListbarCommand[] | { [key: string]: ListbarCommand | Function }
  ): void {
    let commandsArray: ListbarCommand[];
    if (!Array.isArray(commands)) {
      commandsArray = Object.keys(commands).reduce(
        (obj: ListbarCommand[], key: string, i: number): ListbarCommand[] => {
          let cmd = commands[key];
          let cb: Function;

          if (typeof cmd === 'function') {
            cb = cmd;
            cmd = { callback: cb };
          }

          if ((cmd as ListbarCommand).text == null)
            (cmd as ListbarCommand).text = key;
          if ((cmd as ListbarCommand).prefix == null)
            (cmd as ListbarCommand).prefix = ++i + '';

          if (
            (cmd as ListbarCommand).text == null &&
            (cmd as ListbarCommand).callback
          ) {
            (cmd as ListbarCommand).text = (
              cmd as ListbarCommand
            ).callback!.name;
          }

          obj.push(cmd as ListbarCommand);

          return obj;
        },
        []
      );
    } else {
      commandsArray = commands;
    }

    this.items.forEach((el: ListbarElement) => {
      el.detach();
    });

    this.items = [];
    this.ritems = [];
    this.commands = [];

    commandsArray.forEach((cmd: ListbarCommand) => {
      this.add(cmd);
    });

    this.emit('set items');
  }

  add(item: string | Function | ListbarCommand, callback?: Function): void {
    this.addItem(item, callback);
  }

  addItem(item: string | Function | ListbarCommand, callback?: Function): void {
    this.appendItem(item, callback);
  }

  appendItem(
    item: string | Function | ListbarCommand,
    callback?: Function
  ): void {
    const prev = this.items[this.items.length - 1];
    let drawn: number;
    let cmd: ListbarCommand;
    let title: string;
    let len: number;

    if (!this.parent) {
      drawn = 0;
    } else {
      drawn = prev ? prev.aleft + prev.width : 0;
      if (!this.screen.autoPadding) {
        drawn += this.ileft;
      }
    }

    if (typeof item === 'object') {
      cmd = item;
      if (cmd.prefix == null) cmd.prefix = this.items.length + 1 + '';
    }

    if (typeof item === 'string') {
      cmd = {
        prefix: this.items.length + 1 + '',
        text: item,
        callback: callback,
      };
    }

    if (typeof item === 'function') {
      cmd = {
        prefix: this.items.length + 1 + '',
        text: item.name,
        callback: item,
      };
    }

    if (cmd.keys && cmd.keys[0]) {
      cmd.prefix = cmd.keys[0];
    }

    const t = helpers.generateTags(this.style.prefix || { fg: 'lightblack' });

    title =
      (cmd.prefix != null ? t.open + cmd.prefix + t.close + ':' : '') +
      cmd.text;

    len = ((cmd.prefix != null ? cmd.prefix + ':' : '') + cmd.text).length;

    const options = {
      screen: this.screen,
      top: 0,
      left: drawn + 1,
      height: 1,
      content: title,
      width: len + 2,
      align: 'center',
      autoFocus: false,
      tags: true,
      mouse: true,
      style: helpers.merge({}, this.style.item),
      noOverflow: true,
    };

    if (!this.screen.autoPadding) {
      options.top += this.itop;
      options.left += this.ileft;
    }

    ['bg', 'fg', 'bold', 'underline', 'blink', 'inverse', 'invisible'].forEach(
      (name: string) => {
        options.style[name] = () => {
          const attr =
            this.items[this.selected] === el
              ? this.style.selected[name]
              : this.style.item[name];
          if (typeof attr === 'function') return attr(el);
          return attr;
        };
      }
    );

    const el = new Box(options);

    this._[cmd.text] = el;
    cmd.element = el;
    el._.cmd = cmd;

    this.ritems.push(cmd.text);
    this.items.push(el);
    this.commands.push(cmd);
    this.append(el);

    if (cmd.callback) {
      if (cmd.keys) {
        this.screen.key(cmd.keys, () => {
          this.emit('action', el, this.selected);
          this.emit('select', el, this.selected);
          if (el._.cmd.callback) {
            el._.cmd.callback();
          }
          this.select(el);
          this.screen.render();
        });
      }
    }

    if (this.items.length === 1) {
      this.select(0);
    }

    // XXX May be affected by new element.options.mouse option.
    if (this.mouse) {
      el.on('click', () => {
        this.emit('action', el, this.selected);
        this.emit('select', el, this.selected);
        if (el._.cmd.callback) {
          el._.cmd.callback();
        }
        this.select(el);
        this.screen.render();
      });
    }

    this.emit('add item');
  }

  render(): any {
    let drawn = 0;

    if (!this.screen.autoPadding) {
      drawn += this.ileft;
    }

    this.items.forEach((el: ListbarElement, i: number) => {
      if (i < this.leftBase) {
        el.hide();
      } else {
        el.rleft = drawn + 1;
        drawn += el.width + 2;
        el.show();
      }
    });

    return this._render();
  }

  select(offset: number | ListbarElement): void {
    let offsetNum: number;
    if (typeof offset !== 'number') {
      offsetNum = this.items.indexOf(offset);
    } else {
      offsetNum = offset;
    }

    if (offsetNum < 0) {
      offsetNum = 0;
    } else if (offsetNum >= this.items.length) {
      offsetNum = this.items.length - 1;
    }

    if (!this.parent) {
      this.emit('select item', this.items[offsetNum], offsetNum);
      return;
    }

    const lpos = this._getCoords();
    if (!lpos) return;

    const width = lpos.xl - lpos.xi - this.iwidth;
    let drawn = 0;
    let visible = 0;
    const el = this.items[offsetNum];
    if (!el) return;

    this.items.forEach((el: ListbarElement, i: number) => {
      if (i < this.leftBase) return;

      const lpos = el._getCoords();
      if (!lpos) return;

      if (lpos.xl - lpos.xi <= 0) return;

      drawn += lpos.xl - lpos.xi + 2;

      if (drawn <= width) visible++;
    });

    let diff = offsetNum - (this.leftBase + this.leftOffset);
    if (offsetNum > this.leftBase + this.leftOffset) {
      if (offsetNum > this.leftBase + visible - 1) {
        this.leftOffset = 0;
        this.leftBase = offsetNum;
      } else {
        this.leftOffset += diff;
      }
    } else if (offsetNum < this.leftBase + this.leftOffset) {
      diff = -diff;
      if (offsetNum < this.leftBase) {
        this.leftOffset = 0;
        this.leftBase = offsetNum;
      } else {
        this.leftOffset -= diff;
      }
    }

    // XXX Move `action` and `select` events here.
    this.emit('select item', el, offsetNum);
  }

  removeItem(child: number | ListbarElement): void {
    const i = typeof child !== 'number' ? this.items.indexOf(child) : child;

    if (~i && this.items[i]) {
      child = this.items.splice(i, 1)[0];
      this.ritems.splice(i, 1);
      this.commands.splice(i, 1);
      this.remove(child);
      if (i === this.selected) {
        this.select(i - 1);
      }
    }

    this.emit('remove item');
  }

  move(offset: number): void {
    this.select(this.selected + offset);
  }

  moveLeft(offset?: number): void {
    this.move(-(offset || 1));
  }

  moveRight(offset?: number): void {
    this.move(offset || 1);
  }

  selectTab(index: number): void {
    const item = this.items[index];
    if (item) {
      if (item._!.cmd.callback) {
        item._!.cmd.callback();
      }
      this.select(index);
      this.screen.render();
    }
    this.emit('select tab', item, index);
  }
}

/**
 * Factory function for backward compatibility
 */
function listbar(options?: ListbarOptions): ListbarInterface {
  return new Listbar(options) as ListbarInterface;
}

// Attach the class as a property for direct access
listbar.Listbar = Listbar;

/**
 * Expose
 */

export default listbar;
