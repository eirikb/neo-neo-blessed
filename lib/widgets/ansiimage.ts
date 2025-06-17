/**
 * ansiimage.js - render PNGS/GIFS as ANSI
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var cp = require('child_process');

var colors = require('../colors');

var BlessedNode = require('./node');
var BlessedBox = require('./box');

var tng = require('../../vendor/tng.js');

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
 * ANSIImage
 */

function ANSIImage(this: ANSIImageInterface, options?: ANSIImageOptions) {
  var self = this;

  if (!(this instanceof BlessedNode)) {
    return new ANSIImage(options);
  }

  options = options || {};
  options.shrink = true;

  BlessedBox.call(this, options);

  this.scale = this.options.scale || 1.0;
  this.options.animate = this.options.animate !== false;
  this._noFill = true;

  if (this.options.file) {
    this.setImage(this.options.file);
  }

  this.screen.on('prerender', function () {
    var lpos = self.lpos;
    if (!lpos) return;
    // prevent image from blending with itself if there are alpha channels
    self.screen.clearRegion(lpos.xi, lpos.xl, lpos.yi, lpos.yl);
  });

  this.on('destroy', function () {
    self.stop();
  });
}

ANSIImage.prototype.__proto__ = BlessedBox.prototype;

ANSIImage.prototype.type = 'ansiimage';

ANSIImage.curl = function (url: string): Buffer {
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
};

ANSIImage.prototype.setImage = function (
  this: ANSIImageInterface,
  file: string | Buffer
): void {
  this.file = typeof file === 'string' ? file : null;

  if (/^https?:/.test(file)) {
    file = ANSIImage.curl(file);
  }

  var width = this.position.width;
  var height = this.position.height;

  if (width != null) {
    width = this.width;
  }

  if (height != null) {
    height = this.height;
  }

  try {
    this.setContent('');

    this.img = tng(file, {
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
  } catch (e) {
    this.setContent('Image Error: ' + e.message);
    this.img = null;
    this.cellmap = null;
  }
};

ANSIImage.prototype.play = function (this: ANSIImageInterface) {
  var self = this;
  if (!this.img) return;
  return this.img.play(function (bmp: any, cellmap: CellMap) {
    self.cellmap = cellmap;
    self.screen.render();
  });
};

ANSIImage.prototype.pause = function (this: ANSIImageInterface) {
  if (!this.img) return;
  return this.img.pause();
};

ANSIImage.prototype.stop = function (this: ANSIImageInterface) {
  if (!this.img) return;
  return this.img.stop();
};

ANSIImage.prototype.clearImage = function (this: ANSIImageInterface): void {
  this.stop();
  this.setContent('');
  this.img = undefined;
  this.cellmap = undefined;
};

ANSIImage.prototype.render = function (this: ANSIImageInterface) {
  var coords = this._render();
  if (!coords) return;

  if (this.img && this.cellmap) {
    this.img.renderElement(this.cellmap, this);
  }

  return coords;
};

/**
 * Expose
 */

module.exports = ANSIImage;
