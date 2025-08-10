/**
 * terminal.js - xterm.js terminal element for blessed
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
  replaceChildren(): void;
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

  this.termName =
    options.terminal || options.term || process.env.TERM || 'xterm';

  this.filter = options.filter || null;

  this.bootstrap();
}

Terminal.prototype.__proto__ = Box.prototype;

Terminal.prototype.type = 'terminal';

Terminal.prototype.bootstrap = function (this: TerminalInterface): void {
  var self = this;

  var element: MockElement = {
    // window
    get document() {
      return element;
    },
    navigator: { userAgent: 'node.js' },

    // document
    get defaultView() {
      return element;
    },
    get documentElement() {
      return element;
    },
    createElement: function () {
      return element;
    },
    createDocumentFragment: function () {
      return element;
    },

    // element
    get ownerDocument() {
      return element;
    },
    addEventListener: function () {},
    removeEventListener: function () {},
    getElementsByTagName: function () {
      return [element];
    },
    getElementById: function () {
      return element;
    },
    parentNode: null,
    offsetParent: null,
    appendChild: function () {},
    removeChild: function () {},
    remove: function () {}, // For xterm.js DOM removal
    setAttribute: function () {},
    getAttribute: function () {},
    style: {},
    focus: function () {},
    blur: function () {},
    replaceChildren: function () {
      // Mock implementation of Element.replaceChildren()
      // Accepts any number of Node objects or strings as arguments
      // In real DOM, this would replace all children with provided nodes
      // For mock, we can just do nothing (no-op)
    },
    console: console,
    // Mock DOM APIs that xterm.js needs
    classList: {
      add: function () {},
      remove: function () {},
      contains: function () {
        return false;
      },
      toggle: function () {},
    },
    clientWidth: 80 * 9, // approximate char width
    clientHeight: 24 * 17, // approximate char height
    getBoundingClientRect: function () {
      return {
        width: this.clientWidth,
        height: this.clientHeight,
        top: 0,
        left: 0,
        right: this.clientWidth,
        bottom: this.clientHeight,
      };
    },
    // Browser APIs that xterm.js needs
    matchMedia: function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
      };
    },
    requestAnimationFrame: function (callback: Function) {
      return setTimeout(callback, 16); // 60fps
    },
    cancelAnimationFrame: function (id: any) {
      clearTimeout(id);
    },
    // Timer functions for xterm.js
    clearInterval: function (id: any) {
      clearInterval(id);
    },
    setInterval: function (callback: Function, delay: number) {
      return setInterval(callback, delay);
    },
    clearTimeout: function (id: any) {
      clearTimeout(id);
    },
    setTimeout: function (callback: Function, delay: number) {
      return setTimeout(callback, delay);
    },
  };

  element.parentNode = element;
  element.offsetParent = element;

  // Calculate dimensions and ensure they're valid
  var cols = this.width - this.iwidth;
  var rows = this.height - this.iheight;

  // Ensure minimum valid dimensions to prevent RangeError in xterm.js
  if (isNaN(cols) || cols <= 0) cols = 80; // default to 80 columns
  if (isNaN(rows) || rows <= 0) rows = 24; // default to 24 rows

  // Mock global objects for xterm.js
  if (typeof window === 'undefined') {
    (global as any).window = element;
  }
  if (typeof document === 'undefined') {
    (global as any).document = element;
  }

  const { Terminal } = require('@xterm/xterm');
  this.term = new Terminal({
    cols: cols,
    rows: rows,
    cursorBlink: this.cursorBlink,
    scrollback: 1000,
  });

  // Open the terminal in the element
  this.term.open(element);

  // Set up refresh functionality
  this.term.refresh = function () {
    self.screen.render();
  };

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
  this.screen.program.input.on(
    'data',
    (this._onData = function (data: any) {
      if (self.screen.focused === self && !self._isMouse(data)) {
        self.handler(data);
      }
    })
  );

  this.onScreenEvent('mouse', function (data: MouseData) {
    if (self.screen.focused !== self) return;

    if (data.x < self.aleft + self.ileft) return;
    if (data.y < self.atop + self.itop) return;
    if (data.x > self.aleft - self.ileft + self.width) return;
    if (data.y > self.atop - self.itop + self.height) return;

    if (
      self.term.x10Mouse ||
      self.term.vt200Mouse ||
      self.term.normalMouse ||
      self.term.mouseEvents ||
      self.term.utfMouse ||
      self.term.sgrMouse ||
      self.term.urxvtMouse
    ) {
    } else {
      return;
    }

    var b = data.raw[0],
      x = data.x - self.aleft,
      y = data.y - self.atop,
      s;

    if (self.term.urxvtMouse) {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s = '\x1b[' + b + ';' + (x + 32) + ';' + (y + 32) + 'M';
    } else if (self.term.sgrMouse) {
      if (!self.screen.program.sgrMouse) {
        b -= 32;
      }
      s =
        '\x1b[<' +
        b +
        ';' +
        x +
        ';' +
        y +
        (data.action === 'mousedown' ? 'M' : 'm');
    } else {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s =
        '\x1b[M' +
        String.fromCharCode(b) +
        String.fromCharCode(x + 32) +
        String.fromCharCode(y + 32);
    }

    self.handler(s);
  });

  this.on('focus', function () {
    self.term.focus();
  });

  this.on('blur', function () {
    self.term.blur();
  });

  this.term.onTitleChange((title: string) => {
    self.title = title;
    self.emit('title', title);
  });

  // Note: passthrough functionality may need to be implemented differently in xterm.js
  // For now, we'll handle this via the parser or other means if needed

  this.on('resize', function () {
    nextTick(function () {
      var cols = self.width - self.iwidth;
      var rows = self.height - self.iheight;

      // Ensure minimum valid dimensions
      if (isNaN(cols) || cols <= 0) cols = 80;
      if (isNaN(rows) || rows <= 0) rows = 24;

      self.term.resize(cols, rows);
    });
  });

  this.once('render', function () {
    var cols = self.width - self.iwidth;
    var rows = self.height - self.iheight;

    // Ensure minimum valid dimensions
    if (isNaN(cols) || cols <= 0) cols = 80;
    if (isNaN(rows) || rows <= 0) rows = 24;

    self.term.resize(cols, rows);
  });

  this.on('destroy', function () {
    self.kill();
    self.screen.program.input.removeListener('data', self._onData);
  });

  if (this.handler) {
    return;
  }

  // Calculate dimensions for pty
  var ptyCols = this.width - this.iwidth;
  var ptyRows = this.height - this.iheight;

  // Ensure minimum valid dimensions
  if (isNaN(ptyCols) || ptyCols <= 0) ptyCols = 80;
  if (isNaN(ptyRows) || ptyRows <= 0) ptyRows = 24;

  this.pty = require('node-pty').fork(this.shell, this.args, {
    name: this.termName,
    cols: ptyCols,
    rows: ptyRows,
    cwd: process.env.HOME,
    env: this.options.env || process.env,
  });

  this.on('resize', function () {
    nextTick(function () {
      try {
        var cols = self.width - self.iwidth;
        var rows = self.height - self.iheight;

        // Ensure minimum valid dimensions
        if (isNaN(cols) || cols <= 0) cols = 80;
        if (isNaN(rows) || rows <= 0) rows = 24;

        self.pty.resize(cols, rows);
      } catch (e) {}
    });
  });

  this.handler = function (data: string) {
    self.pty.write(data);
    self.screen.render();
  };

  this.pty.on('data', function (data: string) {
    if (self.filter) {
      data = self.filter(data);
    }
    self.write(data);
    self.screen.render();
  });

  this.pty.on('exit', function (code: number) {
    self.emit('exit', code || null);
  });

  this.onScreenEvent('keypress', function () {
    self.screen.render();
  });

  this.screen._listenKeys(this);
};

Terminal.prototype.write = function (
  this: TerminalInterface,
  data: string
): any {
  return this.term.write(data);
};

Terminal.prototype.render = function (this: TerminalInterface): any {
  var ret = this._render();
  if (!ret) return;

  this.dattr = this.sattr(this.style);

  var xi = ret.xi + this.ileft,
    xl = ret.xl - this.iright,
    yi = ret.yi + this.itop,
    yl = ret.yl - this.ibottom,
    cursor;

  // For now, use a simplified rendering approach with xterm.js buffer API
  // TODO: Implement proper buffer reading with color/attribute support
  for (var y = Math.max(yi, 0); y < yl; y++) {
    var line = this.screen.lines[y];
    if (!line) continue;

    var bufferY = y - yi + this.term.buffer.active.viewportY;
    var bufferLine = this.term.buffer.active.getLine(bufferY);
    if (!bufferLine) continue;

    // Check for cursor position
    if (
      y === yi + this.term.buffer.active.cursorY &&
      this.screen.focused === this
    ) {
      cursor = xi + this.term.buffer.active.cursorX;
    } else {
      cursor = -1;
    }

    for (var x = Math.max(xi, 0); x < xl; x++) {
      if (!line[x]) continue;

      var cellX = x - xi;
      var cell = bufferLine.getCell(cellX);
      if (!cell) continue;

      // Set character data
      line[x][1] = cell.getChars() || ' ';

      // Set basic attributes (simplified for now)
      line[x][0] = this.dattr;

      // Handle cursor
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
    }

    line.dirty = true;
  }

  return ret;
};

Terminal.prototype._isMouse = function (
  this: TerminalInterface,
  buf: Buffer | string
): boolean {
  var s = buf;
  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === undefined) {
      s[0] -= 128;
      s = '\x1b' + s.toString('utf-8');
    } else {
      s = s.toString('utf-8');
    }
  }
  return (
    (buf[0] === 0x1b && buf[1] === 0x5b && buf[2] === 0x4d) ||
    /^\x1b\[M([\x00\u0020-\uffff]{3})/.test(s) ||
    /^\x1b\[(\d+;\d+;\d+)M/.test(s) ||
    /^\x1b\[<(\d+;\d+;\d+)([mM])/.test(s) ||
    /^\x1b\[<(\d+;\d+;\d+;\d+)&w/.test(s) ||
    /^\x1b\[24([0135])~\[(\d+),(\d+)\]\r/.test(s) ||
    /^\x1b\[(O|I)/.test(s)
  );
};

Terminal.prototype.setScroll = Terminal.prototype.scrollTo = function (
  this: TerminalInterface,
  offset: number
): boolean {
  // xterm.js doesn't expose direct scrolling control in the same way
  // We'll need to use the scrollLines method or handle this differently
  return this.emit('scroll');
};

Terminal.prototype.getScroll = function (this: TerminalInterface): number {
  return this.term.buffer.active.viewportY;
};

Terminal.prototype.scroll = function (
  this: TerminalInterface,
  offset: number
): boolean {
  // Use xterm.js scroll method
  this.term.scrollLines(offset);
  return this.emit('scroll');
};

Terminal.prototype.resetScroll = function (this: TerminalInterface): boolean {
  // Scroll to bottom of terminal
  this.term.scrollToBottom();
  return this.emit('scroll');
};

Terminal.prototype.getScrollHeight = function (
  this: TerminalInterface
): number {
  return this.term.rows - 1;
};

Terminal.prototype.getScrollPerc = function (this: TerminalInterface): number {
  var buffer = this.term.buffer.active;
  var totalLines = buffer.length;
  var viewportY = buffer.viewportY;
  return totalLines > 0 ? (viewportY / totalLines) * 100 : 0;
};

Terminal.prototype.setScrollPerc = function (
  this: TerminalInterface,
  i: number
): boolean {
  var buffer = this.term.buffer.active;
  var totalLines = buffer.length;
  var targetY = ((i / 100) * totalLines) | 0;
  return this.setScroll(targetY);
};

Terminal.prototype.screenshot = function (
  this: TerminalInterface,
  xi?: number,
  xl?: number,
  yi?: number,
  yl?: number
): string {
  xi = 0 + (xi || 0);
  if (xl != null) {
    xl = 0 + (xl || 0);
  } else {
    xl = this.term.cols;
  }
  yi = 0 + (yi || 0);
  if (yl != null) {
    yl = 0 + (yl || 0);
  } else {
    yl = this.term.buffer.active.length;
  }
  return this.screen.screenshot(xi, xl, yi, yl, this.term);
};

Terminal.prototype.kill = function (this: TerminalInterface): void {
  if (this.pty) {
    this.pty.destroy();
    this.pty.kill();
  }
  this.term.refresh = function () {};
  this.term.write('\x1b[H\x1b[J');
  // Clean up any xterm.js internals if needed
  this.term.dispose();
};

/**
 * Expose
 */

module.exports = Terminal;
