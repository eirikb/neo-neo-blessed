/**
 * terminal.js - term.js terminal element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = require('./node');
var Box = require('./box');

/**
 * Interfaces
 */

interface TerminalOptions {
  handler?: Function;
  shell?: string;
  args?: string[];
  cursor?: any;
  cursorBlink?: boolean;
  screenKeys?: boolean;
  terminal?: string;
  term?: string;
  filter?: Function;
  env?: { [key: string]: string };
  scrollable?: boolean;
  [key: string]: any;
}

interface MockElement {
  document: MockElement;
  navigator: { userAgent: string };
  defaultView: MockElement;
  documentElement: MockElement;
  ownerDocument: MockElement;
  parentNode: MockElement | null;
  offsetParent: MockElement | null;
  style: any;
  console: any;
  createElement(): MockElement;
  addEventListener(): void;
  removeEventListener(): void;
  getElementsByTagName(): MockElement[];
  getElementById(): MockElement;
  appendChild(): void;
  removeChild(): void;
  setAttribute(): void;
  getAttribute(): void;
  focus(): void;
  blur(): void;
}

interface TermObject {
  refresh(): void;
  keyDown(): void;
  keyPress(): void;
  x10Mouse?: boolean;
  vt200Mouse?: boolean;
  normalMouse?: boolean;
  mouseEvents?: boolean;
  utfMouse?: boolean;
  sgrMouse?: boolean;
  urxvtMouse?: boolean;
  x: number;
  y: number;
  ydisp: number;
  ybase: number;
  cursorState: boolean;
  selectMode?: boolean;
  cursorHidden?: boolean;
  lines: any[][];
  open(element: MockElement): void;
  write(data: string): any;
  resize(cols: number, rows: number): void;
  focus(): void;
  blur(): void;
  on(event: string, listener: Function): void;
}

interface PtyObject {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  on(event: string, listener: Function): void;
}

interface MouseData {
  x: number;
  y: number;
  raw: number[];
  action: string;
}

interface TerminalProgram {
  tmux?: boolean;
  tmuxVersion?: number;
  sgrMouse?: boolean;
  enableMouse(): void;
  flush(): void;
  _owrite(data: any): void;
  input: {
    on(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
  };
}

interface TerminalScreen {
  program: TerminalProgram;
  focused: any;
  lines: any[][];
  render(): void;
  _listenKeys(element: any): void;
}

interface TerminalInterface extends Box {
  type: string;
  handler?: Function;
  shell: string;
  args: string[];
  cursor: any;
  cursorBlink?: boolean;
  screenKeys?: boolean;
  termName: string;
  filter: Function | null;
  term: TermObject;
  pty?: PtyObject;
  title?: string;
  _onData?: Function;
  dattr?: number;
  screen: TerminalScreen;
  width: number;
  height: number;
  iwidth: number;
  iheight: number;
  ileft: number;
  iright: number;
  itop: number;
  ibottom: number;
  aleft: number;
  atop: number;
  style: any;
  options: TerminalOptions;
  
  // Methods
  bootstrap(): void;
  write(data: string): any;
  render(): any;
  _render(): any;
  sattr(style: any): number;
  _isMouse(data: any): boolean;
  screenshot(xi?: number, xl?: number, yi?: number, yl?: number): string;
  kill(): void;
  destroy(): void;
  onScreenEvent(event: string, listener: Function): void;
  on(event: string, listener: Function): void;
  once(event: string, listener: Function): void;
  emit(event: string, ...args: any[]): boolean;
}

/**
 * Terminal
 */

function Terminal(this: TerminalInterface, options?: TerminalOptions) {
  if (!(this instanceof Node)) {
    return new Terminal(options);
  }

  options = options || {};
  options.scrollable = false;

  Box.call(this, options);

  // XXX Workaround for all motion
  if (this.screen.program.tmux && this.screen.program.tmuxVersion >= 2) {
    this.screen.program.enableMouse();
  }

  this.handler = options.handler;
  this.shell = options.shell || process.env.SHELL || 'sh';
  this.args = options.args || [];

  this.cursor = this.options.cursor;
  this.cursorBlink = this.options.cursorBlink;
  this.screenKeys = this.options.screenKeys;

  this.style = this.style || {};
  this.style.bg = this.style.bg || 'default';
  this.style.fg = this.style.fg || 'default';

  this.termName = options.terminal
    || options.term
    || process.env.TERM
    || 'xterm';

  this.filter = options.filter || null

  this.bootstrap();
}

Terminal.prototype.__proto__ = Box.prototype;

Terminal.prototype.type = 'terminal';

Terminal.prototype.bootstrap = function(this: TerminalInterface): void {
  var self = this;

  var element: MockElement = {
    // window
    get document() { return element; },
    navigator: { userAgent: 'node.js' },

    // document
    get defaultView() { return element; },
    get documentElement() { return element; },
    createElement: function() { return element; },

    // element
    get ownerDocument() { return element; },
    addEventListener: function() {},
    removeEventListener: function() {},
    getElementsByTagName: function() { return [element]; },
    getElementById: function() { return element; },
    parentNode: null,
    offsetParent: null,
    appendChild: function() {},
    removeChild: function() {},
    setAttribute: function() {},
    getAttribute: function() {},
    style: {},
    focus: function() {},
    blur: function() {},
    console: console
  };

  element.parentNode = element;
  element.offsetParent = element;

  this.term = require('term.js')({
    termName: this.termName,
    cols: this.width - this.iwidth,
    rows: this.height - this.iheight,
    context: element,
    document: element,
    body: element,
    parent: element,
    cursorBlink: this.cursorBlink,
    screenKeys: this.screenKeys
  });

  this.term.refresh = function() {
    self.screen.render();
  };

  this.term.keyDown = function() {};
  this.term.keyPress = function() {};

  this.term.open(element);

  // Emits key sequences in html-land.
  // Technically not necessary here.
  // In reality if we wanted to be neat, we would overwrite the keyDown and
  // keyPress methods with our own node.js-keys->terminal-keys methods, but
  // since all the keys are already coming in as escape sequences, we can just
  // send the input directly to the handler/socket (see below).
  // this.term.on('data', function(data) {
  //   self.handler(data);
  // });

  // Incoming keys and mouse inputs.
  // NOTE: Cannot pass mouse events - coordinates will be off!
  this.screen.program.input.on('data', this._onData = function(data: any) {
    if (self.screen.focused === self && !self._isMouse(data)) {
      self.handler(data);
    }
  });

  this.onScreenEvent('mouse', function(data: MouseData) {
    if (self.screen.focused !== self) return;

    if (data.x < self.aleft + self.ileft) return;
    if (data.y < self.atop + self.itop) return;
    if (data.x > self.aleft - self.ileft + self.width) return;
    if (data.y > self.atop - self.itop + self.height) return;

    if (self.term.x10Mouse
        || self.term.vt200Mouse
        || self.term.normalMouse
        || self.term.mouseEvents
        || self.term.utfMouse
        || self.term.sgrMouse
        || self.term.urxvtMouse) {
      ;
    } else {
      return;
    }

    var b = data.raw[0]
      , x = data.x - self.aleft
      , y = data.y - self.atop
      , s;

    if (self.term.urxvtMouse) {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s = '\x1b[' + b + ';' + (x + 32) + ';' + (y + 32) + 'M';
    } else if (self.term.sgrMouse) {
      if (!self.screen.program.sgrMouse) {
        b -= 32;
      }
      s = '\x1b[<' + b + ';' + x + ';' + y
        + (data.action === 'mousedown' ? 'M' : 'm');
    } else {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s = '\x1b[M'
        + String.fromCharCode(b)
        + String.fromCharCode(x + 32)
        + String.fromCharCode(y + 32);
    }

    self.handler(s);
  });

  this.on('focus', function() {
    self.term.focus();
  });

  this.on('blur', function() {
    self.term.blur();
  });

  this.term.on('title', function(title: string) {
    self.title = title;
    self.emit('title', title);
  });

  this.term.on('passthrough', function(data: any) {
    self.screen.program.flush();
    self.screen.program._owrite(data);
  });

  this.on('resize', function() {
    nextTick(function() {
      self.term.resize(self.width - self.iwidth, self.height - self.iheight);
    });
  });

  this.once('render', function() {
    self.term.resize(self.width - self.iwidth, self.height - self.iheight);
  });

  this.on('destroy', function() {
    self.kill();
    self.screen.program.input.removeListener('data', self._onData);
  });

  if (this.handler) {
    return;
  }

  this.pty = require('node-pty').fork(this.shell, this.args, {
    name: this.termName,
    cols: this.width - this.iwidth,
    rows: this.height - this.iheight,
    cwd: process.env.HOME,
    env: this.options.env || process.env
  });

  this.on('resize', function() {
    nextTick(function() {
      try {
        self.pty.resize(self.width - self.iwidth, self.height - self.iheight);
      } catch (e) {
        ;
      }
    });
  });

  this.handler = function(data: string) {
    self.pty.write(data);
    self.screen.render();
  };

  this.pty.on('data', function(data: string) {
    if (self.filter) {
      data = self.filter(data);
    }
    self.write(data);
    self.screen.render();
  });

  this.pty.on('exit', function(code: number) {
    self.emit('exit', code || null);
  });

  this.onScreenEvent('keypress', function() {
    self.screen.render();
  });

  this.screen._listenKeys(this);
};

Terminal.prototype.write = function(this: TerminalInterface, data: string): any {
  return this.term.write(data);
};

Terminal.prototype.render = function(this: TerminalInterface): any {
  var ret = this._render();
  if (!ret) return;

  this.dattr = this.sattr(this.style);

  var xi = ret.xi + this.ileft
    , xl = ret.xl - this.iright
    , yi = ret.yi + this.itop
    , yl = ret.yl - this.ibottom
    , cursor;

  var scrollback = this.term.lines.length - (yl - yi);

  for (var y = Math.max(yi, 0); y < yl; y++) {
    var line = this.screen.lines[y];
    if (!line || !this.term.lines[scrollback + y - yi]) break;

    if (y === yi + this.term.y
        && this.term.cursorState
        && this.screen.focused === this
        && (this.term.ydisp === this.term.ybase || this.term.selectMode)
        && !this.term.cursorHidden) {
      cursor = xi + this.term.x;
    } else {
      cursor = -1;
    }

    for (var x = Math.max(xi, 0); x < xl; x++) {
      if (!line[x] || !this.term.lines[scrollback + y - yi][x - xi]) break;

      line[x][0] = this.term.lines[scrollback + y - yi][x - xi][0];

      if (x === cursor) {
        if (this.cursor === 'line') {
          line[x][0] = this.dattr;
          line[x][1] = '\u2502';
          continue;
        } else if (this.cursor === 'underline') {
          line[x][0] = this.dattr | (2 << 18);
        } else if (this.cursor === 'block' || !this.cursor) {
          line[x][0] = this.dattr | (8 << 18);
        }
      }

      line[x][1] = this.term.lines[scrollback + y - yi][x - xi][1];

      // default foreground = 257
      if (((line[x][0] >> 9) & 0x1ff) === 257) {
        line[x][0] &= ~(0x1ff << 9);
        line[x][0] |= ((this.dattr >> 9) & 0x1ff) << 9;
      }

      // default background = 256
      if ((line[x][0] & 0x1ff) === 256) {
        line[x][0] &= ~0x1ff;
        line[x][0] |= this.dattr & 0x1ff;
      }
    }

    line.dirty = true;
  }

  return ret;
};

Terminal.prototype._isMouse = function(this: TerminalInterface, buf: Buffer | string): boolean {
  var s = buf;
  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === undefined) {
      s[0] -= 128;
      s = '\x1b' + s.toString('utf-8');
    } else {
      s = s.toString('utf-8');
    }
  }
  return (buf[0] === 0x1b && buf[1] === 0x5b && buf[2] === 0x4d)
    || /^\x1b\[M([\x00\u0020-\uffff]{3})/.test(s)
    || /^\x1b\[(\d+;\d+;\d+)M/.test(s)
    || /^\x1b\[<(\d+;\d+;\d+)([mM])/.test(s)
    || /^\x1b\[<(\d+;\d+;\d+;\d+)&w/.test(s)
    || /^\x1b\[24([0135])~\[(\d+),(\d+)\]\r/.test(s)
    || /^\x1b\[(O|I)/.test(s);
};

Terminal.prototype.setScroll =
Terminal.prototype.scrollTo = function(this: TerminalInterface, offset: number): boolean {
  this.term.ydisp = offset;
  return this.emit('scroll');
};

Terminal.prototype.getScroll = function(this: TerminalInterface): number {
  return this.term.ydisp;
};

Terminal.prototype.scroll = function(this: TerminalInterface, offset: number): boolean {
  this.term.scrollDisp(offset);
  return this.emit('scroll');
};

Terminal.prototype.resetScroll = function(this: TerminalInterface): boolean {
  this.term.ydisp = 0;
  this.term.ybase = 0;
  return this.emit('scroll');
};

Terminal.prototype.getScrollHeight = function(this: TerminalInterface): number {
  return this.term.rows - 1;
};

Terminal.prototype.getScrollPerc = function(this: TerminalInterface): number {
  return (this.term.ydisp / this.term.ybase) * 100;
};

Terminal.prototype.setScrollPerc = function(this: TerminalInterface, i: number): boolean {
  return this.setScroll((i / 100) * this.term.ybase | 0);
};

Terminal.prototype.screenshot = function(this: TerminalInterface, xi?: number, xl?: number, yi?: number, yl?: number): string {
  xi = 0 + (xi || 0);
  if (xl != null) {
    xl = 0 + (xl || 0);
  } else {
    xl = this.term.lines[0].length;
  }
  yi = 0 + (yi || 0);
  if (yl != null) {
    yl = 0 + (yl || 0);
  } else {
    yl = this.term.lines.length;
  }
  return this.screen.screenshot(xi, xl, yi, yl, this.term);
};

Terminal.prototype.kill = function(this: TerminalInterface): void {
  if (this.pty) {
    this.pty.destroy();
    this.pty.kill();
  }
  this.term.refresh = function() {};
  this.term.write('\x1b[H\x1b[J');
  if (this.term._blink) {
    clearInterval(this.term._blink);
  }
  this.term.destroy();
};

/**
 * Expose
 */

module.exports = Terminal;
