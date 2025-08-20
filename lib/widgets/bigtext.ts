/**
 * bigtext.js - bigtext element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Type definitions
 */

interface BigTextOptions {
  font?: string;
  fontBold?: string;
  fch?: string;
  [key: string]: any;
}

interface BigTextRatio {
  width: number;
  height: number;
}

interface BigTextPosition {
  width?: number;
  height?: number;
}

interface BigTextStyle {
  bold?: boolean;
  [key: string]: any;
}

interface BigTextCoords {
  xi: number;
  xl: number;
  yi: number;
  yl: number;
}

interface BigTextGlyph {
  map: string[];
}

interface BigTextFontData {
  width: number;
  height: number;
  glyphs: { [key: string]: BigTextGlyph };
}

interface BigTextFont {
  [character: string]: number[][];
}

interface BigTextLine {
  dirty?: boolean;
  [index: number]: [number, string];
}

interface BigTextScreen {
  lines: BigTextLine[];
}

interface BigTextInterface extends Box {
  type: string;
  fch?: string;
  ratio: BigTextRatio;
  font: BigTextFont;
  fontBold: BigTextFont;
  text: string;
  content: string;
  style: BigTextStyle;
  position: BigTextPosition;
  _shrinkWidth?: boolean;
  _shrinkHeight?: boolean;
  screen: BigTextScreen;
  ileft: number;
  itop: number;
  iright: number;
  ibottom: number;
  ch: string;
  loadFont(filename: string): BigTextFont;
  setContent(content: string): void;
  render(): BigTextCoords | undefined;
  _render(): BigTextCoords | undefined;
  sattr(style: any): number;
}

/**
 * BigText - Modern ES6 Class
 */

class BigText extends Box {
  type = 'bigtext';
  fch?: string;
  ratio: BigTextRatio;
  font: BigTextFont;
  fontBold: BigTextFont;
  text: string;
  _shrinkWidth?: boolean;
  _shrinkHeight?: boolean;

  constructor(options?: BigTextOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Set default font paths
    options.font =
      options.font || path.join(__dirname, '../usr/fonts/ter-u14n.json');
    options.fontBold =
      options.fontBold || path.join(__dirname, '../usr/fonts/ter-u14b.json');

    super(options);

    this.fch = options.fch;
    this.ratio = {} as BigTextRatio;
    this.font = this.loadFont(options.font);
    this.fontBold = this.loadFont(options.fontBold);

    if (this.style.bold) {
      this.font = this.fontBold;
    }
  }

  loadFont(filename: string): BigTextFont {
    let data: BigTextFontData;
    let font: BigTextFont;

    data = JSON.parse(fs.readFileSync(filename, 'utf8'));

    this.ratio.width = data.width;
    this.ratio.height = data.height;

    const convertLetter = (ch: string, lines: string[]): number[][] => {
      let line: number[], i: number;

      while (lines.length > this.ratio.height) {
        lines.shift();
        lines.pop();
      }

      lines = lines.map((line: string): number[] => {
        let chs = line.split('');
        let chsNumbers = chs.map((ch: string): number => {
          return ch === ' ' ? 0 : 1;
        });
        while (chsNumbers.length < this.ratio.width) {
          chsNumbers.push(0);
        }
        return chsNumbers;
      });

      while (lines.length < this.ratio.height) {
        line = [];
        for (i = 0; i < this.ratio.width; i++) {
          line.push(0);
        }
        lines.push(line as any);
      }

      return lines as number[][];
    };

    font = Object.keys(data.glyphs).reduce(
      (out: BigTextFont, ch: string): BigTextFont => {
        const lines = data.glyphs[ch].map;
        out[ch] = convertLetter(ch, lines);
        return out;
      },
      {}
    );

    delete font[' '];

    return font;
  }

  setContent(content: string): void {
    this.content = '';
    this.text = content || '';
  }

  render(): BigTextCoords | undefined {
    if (this.position.width == null || this._shrinkWidth) {
      // if (this.width - this.iwidth < this.ratio.width * this.text.length + 1) {
      this.position.width = this.ratio.width * this.text.length + 1;
      this._shrinkWidth = true;
      // }
    }
    if (this.position.height == null || this._shrinkHeight) {
      // if (this.height - this.iheight < this.ratio.height + 0) {
      this.position.height = this.ratio.height + 0;
      this._shrinkHeight = true;
      // }
    }

    const coords = this._render();
    if (!coords) return;

    const lines = this.screen.lines;
    const left = coords.xi + this.ileft;
    const top = coords.yi + this.itop;
    const right = coords.xl - this.iright;
    const bottom = coords.yl - this.ibottom;

    const dattr = this.sattr(this.style);
    const bg = dattr & 0x1ff;
    const fg = (dattr >> 9) & 0x1ff;
    const flags = (dattr >> 18) & 0x1ff;
    const attr = (flags << 18) | (bg << 9) | fg;

    for (let x = left, i = 0; x < right; x += this.ratio.width, i++) {
      const ch = this.text[i];
      if (!ch) break;
      const map = this.font[ch];
      if (!map) continue;
      for (let y = top; y < Math.min(bottom, top + this.ratio.height); y++) {
        if (!lines[y]) continue;
        const mline = map[y - top];
        if (!mline) continue;
        for (let mx = 0; mx < this.ratio.width; mx++) {
          const mcell = mline[mx];
          if (mcell == null) break;
          if (this.fch && this.fch !== ' ') {
            lines[y][x + mx][0] = dattr;
            lines[y][x + mx][1] = mcell === 1 ? this.fch : this.ch;
          } else {
            lines[y][x + mx][0] = mcell === 1 ? attr : dattr;
            lines[y][x + mx][1] = mcell === 1 ? ' ' : this.ch;
          }
        }
        lines[y].dirty = true;
      }
    }

    return coords;
  }
}

/**
 * Factory function for backward compatibility
 */
function bigtext(options?: BigTextOptions): BigTextInterface {
  return new BigText(options) as BigTextInterface;
}

// Attach the class as a property for direct access
bigtext.BigText = BigText;

/**
 * Expose
 */

export default bigtext;
