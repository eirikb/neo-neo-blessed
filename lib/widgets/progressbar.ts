/**
 * progressbar.js - progress bar element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import inputFactory from './input.js';
const Input = inputFactory.Input;

/**
 * Type definitions
 */

interface ProgressBarOptions {
  filled?: number | string;
  pch?: string;
  ch?: string;
  bch?: string;
  barFg?: string;
  barBg?: string;
  orientation?: 'horizontal' | 'vertical';
  keys?: boolean;
  mouse?: boolean;
  vi?: boolean;
  [key: string]: any;
}

interface ProgressBarKey {
  name: string;
}

interface ProgressBarMouseData {
  x: number;
  y: number;
}

interface ProgressBarPosition {
  xi: number;
  xl: number;
  yi: number;
  yl: number;
}

interface ProgressBarScreen {
  render(): void;
  fillRegion(
    attr: any,
    ch: string,
    x1: number,
    x2: number,
    y1: number,
    y2: number
  ): void;
  lines: Array<{ dirty?: boolean; [index: number]: [any, string] }>;
}

interface ProgressBarInterface extends Input {
  type: string;
  filled: number;
  value: number;
  pch: string;
  ch: string;
  orientation: 'horizontal' | 'vertical';
  style: {
    bar?: {
      fg?: string;
      bg?: string;
    };
  };
  lpos?: ProgressBarPosition;
  iwidth: number;
  iheight: number;
  border?: boolean;
  content?: string;
  screen: ProgressBarScreen;
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  _render(): ProgressBarPosition | null;
  sattr(style: any): any;
  progress(filled: number): void;
  setProgress(filled: number): void;
  reset(): void;
}

/**
 * ProgressBar - Modern ES6 Class
 */

class ProgressBar extends Input {
  type = 'progress-bar';
  filled: number;
  value: number;
  pch: string;
  orientation: 'horizontal' | 'vertical';

  constructor(options?: ProgressBarOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    this.filled = options.filled || 0;
    if (typeof this.filled === 'string') {
      this.filled = +(this.filled as string).slice(0, -1);
    }
    this.value = this.filled;

    this.pch = options.pch || ' ';

    // XXX Workaround that predates the usage of `el.ch`.
    if (options.ch) {
      this.pch = options.ch;
      this.ch = ' ';
    }
    if (options.bch) {
      this.ch = options.bch;
    }

    if (!this.style.bar) {
      this.style.bar = {};
      this.style.bar.fg = options.barFg;
      this.style.bar.bg = options.barBg;
    }

    this.orientation = options.orientation || 'horizontal';

    if (options.keys) {
      this.on('keypress', (ch: string, key: ProgressBarKey) => {
        let back: string[], forward: string[];
        if (this.orientation === 'horizontal') {
          back = ['left', 'h'];
          forward = ['right', 'l'];
        } else if (this.orientation === 'vertical') {
          back = ['down', 'j'];
          forward = ['up', 'k'];
        }
        if (key.name === back![0] || (options.vi && key.name === back![1])) {
          this.progress(-5);
          this.screen.render();
          return;
        }
        if (
          key.name === forward![0] ||
          (options.vi && key.name === forward![1])
        ) {
          this.progress(5);
          this.screen.render();
          return;
        }
      });
    }

    if (options.mouse) {
      this.on('click', (data: ProgressBarMouseData) => {
        let x: number, y: number, m: number, p: number;
        if (!this.lpos) return;
        if (this.orientation === 'horizontal') {
          x = data.x - this.lpos.xi;
          m = this.lpos.xl - this.lpos.xi - this.iwidth;
          p = ((x / m) * 100) | 0;
        } else if (this.orientation === 'vertical') {
          y = data.y - this.lpos.yi;
          m = this.lpos.yl - this.lpos.yi - this.iheight;
          p = ((y / m) * 100) | 0;
        }
        this.setProgress(p!);
      });
    }
  }

  render(): ProgressBarPosition | null {
    const ret = this._render();
    if (!ret) return null;

    let xi = ret.xi;
    let xl = ret.xl;
    let yi = ret.yi;
    let yl = ret.yl;
    let dattr: any;

    if (this.border) xi++, yi++, xl--, yl--;

    if (this.orientation === 'horizontal') {
      xl = (xi + (xl - xi) * (this.filled / 100)) | 0;
    } else if (this.orientation === 'vertical') {
      yi = yi + (yl - yi - (((yl - yi) * (this.filled / 100)) | 0));
    }

    dattr = this.sattr(this.style.bar);

    this.screen.fillRegion(dattr, this.pch, xi, xl, yi, yl);

    if (this.content) {
      const line = this.screen.lines[yi];
      for (let i = 0; i < this.content.length; i++) {
        line[xi + i][1] = this.content[i];
      }
      line.dirty = true;
    }

    return ret;
  }

  progress(filled: number): void {
    this.filled += filled;
    if (this.filled < 0) this.filled = 0;
    else if (this.filled > 100) this.filled = 100;
    if (this.filled === 100) {
      this.emit('complete');
    }
    this.value = this.filled;
  }

  setProgress(filled: number): void {
    this.filled = 0;
    this.progress(filled);
  }

  reset(): void {
    this.emit('reset');
    this.filled = 0;
    this.value = this.filled;
  }
}

/**
 * Factory function for backward compatibility
 */
function progressBar(options?: ProgressBarOptions): ProgressBarInterface {
  return new ProgressBar(options) as ProgressBarInterface;
}

// Attach the class as a property for direct access
progressBar.ProgressBar = ProgressBar;

/**
 * Expose
 */

export default progressBar;
