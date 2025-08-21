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
import { match, vcolors } from '../colors.js';

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
  _rawAnsiBuffer: string;

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
      // Enhanced color support configuration
      allowTransparency: true,
      drawBoldTextInBrightColors: true,
      // Enable all color modes for maximum compatibility
      minimumContrastRatio: 1,
      // Advanced features for better compatibility
      convertEol: false, // Don't convert \n to \r\n (preserves original formatting)
      disableStdin: false, // Allow input handling
      cursorBlink: options.cursorBlink || false,
      cursorStyle: 'block', // Default cursor style
      altClickMovesCursor: false, // Disable alt-click cursor movement for compatibility
      rightClickSelectsWord: false, // Disable right-click selection to avoid conflicts
      fastScrollModifier: 'none', // Disable fast scroll modifiers
      wordSeparator: ' ()[]{},"\':;', // Standard word separators
    });

    this.pty = spawn(this.shell, this.args, {
      cols: cols,
      rows: rows,
      cwd: process.env.HOME,
    });

    this.term.onData(d => this.pty.write(d));

    // Store raw ANSI sequences with line tracking for tmux-like passthrough
    this._rawAnsiBuffer = '';

    this.pty.onData(d => {
      const data = d.toString();

      // Store raw ANSI data - keep it organized by recent output
      this._rawAnsiBuffer = data; // Only keep the most recent chunk for direct replay

      // Send to xterm.js for structural processing
      this.term.write(d);
    });

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

  extractColor(cell: any, type: 'foreground' | 'background'): number {
    // Check if it's default color first
    if (type === 'foreground' && cell.isFgDefault()) {
      return -1;
    }
    if (type === 'background' && cell.isBgDefault()) {
      return -1;
    }

    const color = type === 'foreground' ? cell.getFgColor() : cell.getBgColor();

    // Handle RGB colors (24-bit true color)
    if (type === 'foreground' ? cell.isFgRGB() : cell.isBgRGB()) {
      // For RGB mode, color is 0xRRGGBB
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;

      // Use blessed's color matching to find closest terminal color
      return match(r, g, b);
    }

    // Handle 256-color palette mode
    if (type === 'foreground' ? cell.isFgPalette() : cell.isBgPalette()) {
      // In palette mode, color is directly the palette index (0-255)
      return color >= 0 && color <= 255 ? color : -1;
    }

    // Fallback for any other cases
    return -1;
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

        // Enhanced character handling for Unicode
        var chars = cell.getChars();
        if (!chars || chars === '') {
          chars = ' ';
        }
        line[x][1] = chars;

        // Use new 24-bit color format
        var attr = this.dattr || 0x07 * 0x1000000; // fg=7, bg=0

        // Enhanced attribute support (flags now using Math operations)
        var flags = 0;
        if (cell.isBold()) flags |= 1;
        if (cell.isUnderline()) flags |= 2;
        if (cell.isInverse()) flags |= 8;
        if (cell.isDim()) flags |= 4;
        if (cell.isItalic()) flags |= 16;
        if (cell.isStrikethrough()) flags |= 32;
        if (cell.isBlink()) flags |= 64;
        if (cell.isInvisible()) flags |= 128;
        if (cell.isOverline()) flags |= 256;

        // 24-bit RGB color extraction
        var fg = 0xffffff; // default (means use default)
        var bg = 0xffffff; // default (means use default)

        if (!cell.isFgDefault()) {
          if (cell.isFgRGB()) {
            // Store full RGB value directly
            fg = cell.getFgColor(); // Already in 0xRRGGBB format
          } else if (cell.isFgPalette()) {
            // Keep palette colors as-is (0-255)
            fg = cell.getFgColor();
          }
        }

        if (!cell.isBgDefault()) {
          if (cell.isBgRGB()) {
            // Store full RGB value directly
            bg = cell.getBgColor(); // Already in 0xRRGGBB format
          } else if (cell.isBgPalette()) {
            // Keep palette colors as-is (0-255)
            bg = cell.getBgColor();
          }
        }

        // Pack into new format: bg + (fg * 2^24) + (flags * 2^48)
        attr = bg + fg * 0x1000000 + flags * 0x1000000000000;

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
