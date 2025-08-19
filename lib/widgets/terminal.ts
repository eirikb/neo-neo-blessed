/**
 * terminal.js - terminal element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;
import * as xterm from '@xterm/headless';
const XTerminal = xterm.Terminal;
import { spawn } from 'node-pty';

/**
 * Type definitions
 */

import { TerminalOptions, TerminalInterface } from '../types/widgets';

/**
 * Terminal - Modern ES6 Class
 */

class Terminal extends Box {
  type = 'terminal';
  shell: string;
  args: string[];
  term: any;
  pty: any;
  _onData: Function;

  constructor(options?: TerminalOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    this.shell = options.shell || process.env.SHELL || 'bash';
    this.args = options.args || [];

    this.bootstrap(options);
  }

  bootstrap(options: TerminalOptions) {
    var cols = 80;
    var rows = 24;

    if (this.width > 0 && this.height > 0) {
      cols = Math.max(this.width - this.iwidth, 1);
      rows = Math.max(this.height - this.iheight, 1);
    }

    this.term = new XTerminal({
      cols: cols,
      rows: rows,
      scrollback: 5000,
      allowProposedApi: true,
    });

    this.pty = spawn(this.shell, this.args, {
      cols: cols,
      rows: rows,
      cwd: process.env.HOME,
    });

    this.term.onData(d => this.pty.write(d));
    this.pty.onData(d => this.term.write(d));

    if (
      this.screen.program.input &&
      typeof this.screen.program.input.on === 'function'
    ) {
      this.screen.program.input.on(
        'data',
        (this._onData = (data: any) => {
          if (this.screen.focused === this) {
            this.term.input(data.toString());
          }
        })
      );
    }

    this.pty.onData(() => {
      setTimeout(() => this.screen.render(), 16);
    });

    this.on('resize', () => {
      var cols = Math.max(this.width - this.iwidth, 1);
      var rows = Math.max(this.height - this.iheight, 1);
      this.term.resize(cols, rows);
      this.pty.resize(cols, rows);
    });

    this.once('render', () => {
      var actualCols = Math.max(this.width - this.iwidth, 1);
      var actualRows = Math.max(this.height - this.iheight, 1);
      if (actualCols !== cols || actualRows !== rows) {
        this.term.resize(actualCols, actualRows);
        this.pty.resize(actualCols, actualRows);
      }
    });

    this.on('destroy', () => this.kill());
  }

  render() {
    var ret = this._render();
    if (!ret) return;

    var xi = ret.xi + this.ileft;
    var xl = ret.xl - this.iright;
    var yi = ret.yi + this.itop;
    var yl = ret.yl - this.ibottom;

    xi = Math.max(xi, 0);
    xl = Math.min(xl, this.screen.width);
    yi = Math.max(yi, 0);
    yl = Math.min(yl, this.screen.height);

    if (xi >= xl || yi >= yl) return ret;

    const buf = this.term.buffer.active;
    for (var y = yi; y < yl; y++) {
      var line = this.screen.lines[y];
      if (!line) continue;

      var bufferY = y - yi;
      var bufferLine = buf.getLine(bufferY);
      if (!bufferLine) continue;

      for (var x = xi; x < xl; x++) {
        if (!line[x]) continue;

        var cellX = x - xi;
        var cell = bufferLine.getCell(cellX);
        if (!cell) continue;

        line[x][1] = cell.getChars() || ' ';

        var attr = this.dattr || (0x07 << 9) | 0x00;

        if (cell.isBold()) attr |= 1 << 18;
        if (cell.isUnderline()) attr |= 2 << 18;
        if (cell.isInverse()) attr |= 8 << 18;

        var fg = cell.getFgColor();
        var bg = cell.getBgColor();

        if (fg !== undefined && fg !== -1) {
          attr = (attr & ~(0x1ff << 9)) | ((fg & 0x1ff) << 9);
        } else {
          attr = (attr & ~(0x1ff << 9)) | (0x07 << 9);
        }

        if (bg !== undefined && bg !== -1) {
          attr = (attr & ~0x1ff) | (bg & 0x1ff);
        } else {
          attr = (attr & ~0x1ff) | 0x00;
        }

        line[x][0] = attr;
      }
      line.dirty = true;
    }

    return ret;
  }

  write(data: string) {
    if (this.term) {
      this.term.write(data);
    }
  }

  kill() {
    if (this.pty) this.pty.kill();
    if (this.term) this.term.dispose();
    if (
      this.screen.program.input &&
      typeof this.screen.program.input.removeListener === 'function'
    ) {
      this.screen.program.input.removeListener('data', this._onData);
    } else if (
      this.screen.program.input &&
      typeof this.screen.program.input.off === 'function'
    ) {
      this.screen.program.input.off('data', this._onData);
    }
  }
}

/**
 * Factory function for backward compatibility
 */
function terminal(options?: TerminalOptions): TerminalInterface {
  return new Terminal(options) as TerminalInterface;
}

// Attach the class as a property for direct access
terminal.Terminal = Terminal;

/**
 * Expose
 */

export default terminal;
