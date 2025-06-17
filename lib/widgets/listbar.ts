/**
 * listbar.js - listbar element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const helpers = require('../helpers');

const Node = require('./node');
const Box = require('./box');

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
  setItems(commands: ListbarCommand[] | { [key: string]: ListbarCommand | Function }): void;
  add(item: string | Function | ListbarCommand, callback?: Function): void;
  addItem(item: string | Function | ListbarCommand, callback?: Function): void;
  appendItem(item: string | Function | ListbarCommand, callback?: Function): void;
  render(): any;
  select(offset: number | ListbarElement): void;
  removeItem(child: number | ListbarElement): void;
  move(offset: number): void;
  moveLeft(offset?: number): void;
  moveRight(offset?: number): void;
  selectTab(index: number): void;
}

/**
 * Listbar / HorizontalList
 */

function Listbar(this: ListbarInterface, options?: ListbarOptions) {
  const self = this;

  if (!(this instanceof Node)) {
    return new (Listbar as any)(options);
  }

  options = options || {};

  this.items = [];
  this.ritems = [];
  this.commands = [];

  this.leftBase = 0;
  this.leftOffset = 0;

  this.mouse = options.mouse || false;

  Box.call(this, options);

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
    this.on('keypress', function(ch: string, key: ListbarKey) {
      if (key.name === 'left'
          || (options!.vi && key.name === 'h')
          || (key.shift && key.name === 'tab')) {
        self.moveLeft();
        self.screen.render();
        // Stop propagation if we're in a form.
        if (key.name === 'tab') return false;
        return;
      }
      if (key.name === 'right'
          || (options!.vi && key.name === 'l')
          || key.name === 'tab') {
        self.moveRight();
        self.screen.render();
        // Stop propagation if we're in a form.
        if (key.name === 'tab') return false;
        return;
      }
      if (key.name === 'enter'
          || (options!.vi && key.name === 'k' && !key.shift)) {
        self.emit('action', self.items[self.selected], self.selected);
        self.emit('select', self.items[self.selected], self.selected);
        const item = self.items[self.selected];
        if (item._!.cmd.callback) {
          item._!.cmd.callback();
        }
        self.screen.render();
        return;
      }
      if (key.name === 'escape' || (options!.vi && key.name === 'q')) {
        self.emit('action');
        self.emit('cancel');
        return;
      }
    });
  }

  if (options.autoCommandKeys) {
    this.onScreenEvent('keypress', function(ch: string) {
      if (/^[0-9]$/.test(ch)) {
        let i = +ch - 1;
        if (!~i) i = 9;
        return self.selectTab(i);
      }
    });
  }

  this.on('focus', function() {
    self.select(self.selected);
  });
}

Listbar.prototype.__proto__ = Box.prototype;

Listbar.prototype.type = 'listbar';

Listbar.prototype.__defineGetter__('selected', function(this: ListbarInterface): number {
  return this.leftBase + this.leftOffset;
});

Listbar.prototype.setItems = function(this: ListbarInterface, commands: ListbarCommand[] | { [key: string]: ListbarCommand | Function }): void {
  const self = this;

  let commandsArray: ListbarCommand[];
  if (!Array.isArray(commands)) {
    commandsArray = Object.keys(commands).reduce(function(obj: ListbarCommand[], key: string, i: number): ListbarCommand[] {
      let cmd = commands[key];
      let cb: Function;

      if (typeof cmd === 'function') {
        cb = cmd;
        cmd = { callback: cb };
      }

      if ((cmd as ListbarCommand).text == null) (cmd as ListbarCommand).text = key;
      if ((cmd as ListbarCommand).prefix == null) (cmd as ListbarCommand).prefix = ++i + '';

      if ((cmd as ListbarCommand).text == null && (cmd as ListbarCommand).callback) {
        (cmd as ListbarCommand).text = (cmd as ListbarCommand).callback!.name;
      }

      obj.push(cmd as ListbarCommand);

      return obj;
    }, []);
  } else {
    commandsArray = commands;
  }

  this.items.forEach(function(el: ListbarElement) {
    el.detach();
  });

  this.items = [];
  this.ritems = [];
  this.commands = [];

  commandsArray.forEach(function(cmd: ListbarCommand) {
    self.add(cmd);
  });

  this.emit('set items');
};

Listbar.prototype.add =
Listbar.prototype.addItem =
Listbar.prototype.appendItem = function(item, callback) {
  var self = this
    , prev = this.items[this.items.length - 1]
    , drawn
    , cmd
    , title
    , len;

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
    if (cmd.prefix == null) cmd.prefix = (this.items.length + 1) + '';
  }

  if (typeof item === 'string') {
    cmd = {
      prefix: (this.items.length + 1) + '',
      text: item,
      callback: callback
    };
  }

  if (typeof item === 'function') {
    cmd = {
      prefix: (this.items.length + 1) + '',
      text: item.name,
      callback: item
    };
  }

  if (cmd.keys && cmd.keys[0]) {
    cmd.prefix = cmd.keys[0];
  }

  var t = helpers.generateTags(this.style.prefix || { fg: 'lightblack' });

  title = (cmd.prefix != null ? t.open + cmd.prefix + t.close + ':' : '') + cmd.text;

  len = ((cmd.prefix != null ? cmd.prefix + ':' : '') + cmd.text).length;

  var options = {
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
    noOverflow: true
  };

  if (!this.screen.autoPadding) {
    options.top += this.itop;
    options.left += this.ileft;
  }

  ['bg', 'fg', 'bold', 'underline',
   'blink', 'inverse', 'invisible'].forEach(function(name) {
    options.style[name] = function() {
      var attr = self.items[self.selected] === el
        ? self.style.selected[name]
        : self.style.item[name];
      if (typeof attr === 'function') attr = attr(el);
      return attr;
    };
  });

  var el = new Box(options);

  this._[cmd.text] = el;
  cmd.element = el;
  el._.cmd = cmd;

  this.ritems.push(cmd.text);
  this.items.push(el);
  this.commands.push(cmd);
  this.append(el);

  if (cmd.callback) {
    if (cmd.keys) {
      this.screen.key(cmd.keys, function() {
        self.emit('action', el, self.selected);
        self.emit('select', el, self.selected);
        if (el._.cmd.callback) {
          el._.cmd.callback();
        }
        self.select(el);
        self.screen.render();
      });
    }
  }

  if (this.items.length === 1) {
    this.select(0);
  }

  // XXX May be affected by new element.options.mouse option.
  if (this.mouse) {
    el.on('click', function() {
      self.emit('action', el, self.selected);
      self.emit('select', el, self.selected);
      if (el._.cmd.callback) {
        el._.cmd.callback();
      }
      self.select(el);
      self.screen.render();
    });
  }

  this.emit('add item');
};

Listbar.prototype.render = function(this: ListbarInterface): any {
  const self = this;
  let drawn = 0;

  if (!this.screen.autoPadding) {
    drawn += this.ileft;
  }

  this.items.forEach(function(el: ListbarElement, i: number) {
    if (i < self.leftBase) {
      el.hide();
    } else {
      el.rleft = drawn + 1;
      drawn += el.width + 2;
      el.show();
    }
  });

  return this._render();
};

Listbar.prototype.select = function(offset) {
  if (typeof offset !== 'number') {
    offset = this.items.indexOf(offset);
  }

  if (offset < 0) {
    offset = 0;
  } else if (offset >= this.items.length) {
    offset = this.items.length - 1;
  }

  if (!this.parent) {
    this.emit('select item', this.items[offset], offset);
    return;
  }

  var lpos = this._getCoords();
  if (!lpos) return;

  var self = this
    , width = (lpos.xl - lpos.xi) - this.iwidth
    , drawn = 0
    , visible = 0
    , el;

  el = this.items[offset];
  if (!el) return;

  this.items.forEach(function(el, i) {
    if (i < self.leftBase) return;

    var lpos = el._getCoords();
    if (!lpos) return;

    if (lpos.xl - lpos.xi <= 0) return;

    drawn += (lpos.xl - lpos.xi) + 2;

    if (drawn <= width) visible++;
  });

  var diff = offset - (this.leftBase + this.leftOffset);
  if (offset > this.leftBase + this.leftOffset) {
    if (offset > this.leftBase + visible - 1) {
      this.leftOffset = 0;
      this.leftBase = offset;
    } else {
      this.leftOffset += diff;
    }
  } else if (offset < this.leftBase + this.leftOffset) {
    diff = -diff;
    if (offset < this.leftBase) {
      this.leftOffset = 0;
      this.leftBase = offset;
    } else {
      this.leftOffset -= diff;
    }
  }

  // XXX Move `action` and `select` events here.
  this.emit('select item', el, offset);
};

Listbar.prototype.removeItem = function(this: ListbarInterface, child: number | ListbarElement): void {
  const i = typeof child !== 'number'
    ? this.items.indexOf(child)
    : child;

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
};

Listbar.prototype.move = function(this: ListbarInterface, offset: number): void {
  this.select(this.selected + offset);
};

Listbar.prototype.moveLeft = function(this: ListbarInterface, offset?: number): void {
  this.move(-(offset || 1));
};

Listbar.prototype.moveRight = function(this: ListbarInterface, offset?: number): void {
  this.move(offset || 1);
};

Listbar.prototype.selectTab = function(this: ListbarInterface, index: number): void {
  const item = this.items[index];
  if (item) {
    if (item._!.cmd.callback) {
      item._!.cmd.callback();
    }
    this.select(index);
    this.screen.render();
  }
  this.emit('select tab', item, index);
};

/**
 * Expose
 */

module.exports = Listbar;
