/**
 * ansiimage.js - render PNGS/GIFS as ANSI
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as cp from 'child_process';

import * as colors from '../colors.js';

import BlessedNode from './node.js';
import boxFactory from './box.js';
const BlessedBox = boxFactory.Box;

import processImage from '../image-processor.js';

/**
 * Interfaces
 */

interface ANSIImageOptions {
  scale?: number;
  animate?: boolean;
  file?: string;
  ascii?: boolean;
  speed?: number;
  shrink?: boolean;
  [key: string]: any;
}

interface CellMap {
  [row: number]: any[];
  length: number;
}

interface TngImage {
  cellmap: CellMap;
  frames?: any[];
  play(callback: (bmp: any, cellmap: CellMap) => void): any;
  pause(): any;
  stop(): any;
  renderElement(cellmap: CellMap, element: any): void;
}

interface ANSIImageScreen {
  clearRegion(xi: number, xl: number, yi: number, yl: number): void;
  render(): void;
  on(event: string, listener: Function): void;
}

interface ANSIImagePosition {
  width?: number;
  height?: number;
  [key: string]: any;
}

interface ANSIImageCoords {
  xi: number;
  xl: number;
  yi: number;
  yl: number;
}

interface ANSIImageInterface extends any {
  type: string;
  scale: number;
  options: ANSIImageOptions;
  _noFill: boolean;
  file?: string;
  img?: TngImage;
  cellmap?: CellMap;
  screen: ANSIImageScreen;
  position: ANSIImagePosition;
  width: number;
  height: number;
  lpos?: ANSIImageCoords;

  // Methods
  setImage(file: string | Buffer): void;
  play(): any;
  pause(): any;
  stop(): any;
  clearImage(): void;
  render(): ANSIImageCoords | undefined;
  _render(): ANSIImageCoords | undefined;
  setContent(content: string): void;
  on(event: string, listener: Function): void;
}

/**
 * ANSIImage - Modern ES6 Class
 */

class ANSIImage extends BlessedBox {
  type = 'ansiimage';
  scale: number;
  _noFill: boolean = true;
  file?: string;
  img?: TngImage;
  cellmap?: CellMap;

  constructor(options?: ANSIImageOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Ensure shrink is set
    options.shrink = true;

    super(options);

    this.scale = this.options.scale || 1.0;
    this.options.animate = this.options.animate !== false;
    this._noFill = true;

    if (this.options.file) {
      this.setImage(this.options.file);
    }

    // Set up prerender handler to prevent image blending
    this.screen.on('prerender', () => {
      const lpos = this.lpos;
      if (!lpos) return;
      // prevent image from blending with itself if there are alpha channels
      this.screen.clearRegion(lpos.xi, lpos.xl, lpos.yi, lpos.yl);
    });

    // Set up destroy handler
    this.on('destroy', () => {
      this.stop();
    });
  }

  static curl(url: string): Buffer {
    try {
      return cp.execFileSync('curl', ['-s', '-A', '', url], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch (e) {}
    try {
      return cp.execFileSync('wget', ['-U', '', '-O', '-', url], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch (e) {}
    throw new Error('curl or wget failed.');
  }

  setImage(file: string | Buffer): void {
    this.file = typeof file === 'string' ? file : null;

    if (typeof file === 'string' && /^https?:/.test(file)) {
      file = ANSIImage.curl(file);
    }

    let width = this.position.width;
    let height = this.position.height;

    if (width != null) {
      width = this.width;
    }

    if (height != null) {
      height = this.height;
    }

    try {
      this.setContent('');

      this.img = processImage(file, {
        colors: colors,
        width: width,
        height: height,
        scale: this.scale,
        ascii: this.options.ascii,
        speed: this.options.speed,
        filename: this.file,
      }) as TngImage;

      if (width == null || height == null) {
        this.width = this.img.cellmap[0].length;
        this.height = this.img.cellmap.length;
      }

      if (this.img.frames && this.options.animate) {
        this.play();
      } else {
        this.cellmap = this.img.cellmap;
      }
    } catch (e: any) {
      this.setContent('Image Error: ' + e.message);
      this.img = undefined;
      this.cellmap = undefined;
    }
  }

  play(): any {
    if (!this.img) return;
    return this.img.play((bmp: any, cellmap: CellMap) => {
      this.cellmap = cellmap;
      this.screen.render();
    });
  }

  pause(): any {
    if (!this.img) return;
    return this.img.pause();
  }

  stop(): any {
    if (!this.img) return;
    return this.img.stop();
  }

  clearImage(): void {
    this.stop();
    this.setContent('');
    this.img = undefined;
    this.cellmap = undefined;
  }

  render(): ANSIImageCoords | undefined {
    const coords = this._render();
    if (!coords) return;

    if (this.img && this.cellmap) {
      this.img.renderElement(this.cellmap, this);
    }

    return coords;
  }
}

/**
 * Factory function for backward compatibility
 */
function ansiImage(options?: ANSIImageOptions): ANSIImageInterface {
  return new ANSIImage(options) as ANSIImageInterface;
}

// Attach the class as a property for direct access
ansiImage.ANSIImage = ANSIImage;

/**
 * Expose
 */

export default ansiImage;
