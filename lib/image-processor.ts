/**
 * image-processor.ts - modern PNG/GIF reader replacement for tng.js
 * Copyright (c) 2025, Contributors (MIT License).
 * Replaces the legacy vendor/tng.js with modern npm dependencies
 */

import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

interface ImageOptions {
  colors?: any;
  width?: number;
  height?: number;
  scale?: number;
  ascii?: boolean;
  speed?: number;
  filename?: string;
}

interface CellMap {
  [row: number]: any[];
  length: number;
}

interface ImageResult {
  cellmap: CellMap;
  frames?: any[];
  play?(callback: (bmp: any, cellmap: CellMap) => void): any;
  pause?(): any;
  stop?(): any;
  renderElement?(cellmap: CellMap, element: any): void;
}

class ModernImageProcessor {
  private options: ImageOptions;
  private colors: any;
  private png: PNG | null = null;
  private format: string;

  constructor(file: string | Buffer, options: ImageOptions = {}) {
    this.options = options;
    this.colors = options.colors || require('./colors');

    this.loadImage(file);
  }

  private loadImage(file: string | Buffer): void {
    let buf: Buffer;

    if (Buffer.isBuffer(file)) {
      buf = file;
    } else {
      buf = fs.readFileSync(file);
    }

    // Detect format
    if (buf.readUInt32BE(0) === 0x89504e47) {
      this.format = 'png';
      this.png = PNG.sync.read(buf);
    } else if (buf.slice(0, 3).toString('ascii') === 'GIF') {
      this.format = 'gif';
      throw new Error('GIF format not yet supported in modern implementation');
    } else if (buf.readUInt16BE(0) === 0xffd8) {
      this.format = 'jpg';
      throw new Error('JPEG format not yet supported in modern implementation');
    } else {
      throw new Error('Unsupported image format');
    }
  }

  createCellmap(): CellMap {
    if (!this.png) {
      throw new Error('No image loaded');
    }

    const bmp = this.pngToBitmap();
    return this.bitmapToCellmap(bmp);
  }

  private pngToBitmap(): number[][][] {
    if (!this.png) {
      throw new Error('No PNG loaded');
    }

    const { width, height, data } = this.png;
    const bmp: number[][][] = [];

    for (let y = 0; y < height; y++) {
      const row: number[][] = [];
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        row.push([r, g, b, a]);
      }
      bmp.push(row);
    }

    return bmp;
  }

  private bitmapToCellmap(bmp: number[][][]): CellMap {
    const cellmap: any[] = [];
    const scale = this.options.scale || 0.2;
    const height = bmp.length;
    const width = bmp[0].length;

    let cmwidth = this.options.width;
    let cmheight = this.options.height;

    let actualScale = scale;
    if (cmwidth) {
      actualScale = cmwidth / width;
    } else if (cmheight) {
      actualScale = cmheight / height;
    }

    if (!cmheight) {
      cmheight = Math.round(height * actualScale);
    }

    if (!cmwidth) {
      cmwidth = Math.round(width * actualScale);
    }

    const ys = height / cmheight;
    const xs = width / cmwidth;

    for (let y = 0; y < bmp.length; y += ys) {
      const line: any[] = [];
      const yy = Math.round(y);
      if (!bmp[yy]) break;

      for (let x = 0; x < bmp[yy].length; x += xs) {
        const xx = Math.round(x);
        if (!bmp[yy][xx]) break;

        // Convert RGBA to terminal cell representation
        const pixel = bmp[yy][xx];
        const cell = this.pixelToCell(pixel);
        line.push(cell);
      }
      cellmap.push(line);
    }

    // Add length property for compatibility
    Object.defineProperty(cellmap, 'length', {
      value: cellmap.length,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    return cellmap as CellMap;
  }

  private pixelToCell(pixel: number[]): any {
    // Convert RGBA pixel to terminal cell representation
    // This is a simplified version - the original tng.js had complex color matching
    const [r, g, b, a] = pixel;

    if (a < 128) {
      // Transparent pixel
      return { char: ' ', fg: 'default', bg: 'default' };
    }

    // Use the colors module to find the best matching color
    if (this.colors && this.colors.match) {
      const color = this.colors.match(r, g, b);
      return {
        char: '█', // Full block character
        fg: color,
        bg: 'default',
      };
    }

    // Fallback: basic grayscale
    const gray = Math.round((r + g + b) / 3);
    const char = gray > 128 ? '█' : gray > 64 ? '▓' : gray > 32 ? '▒' : '░';

    return {
      char: char,
      fg: 'white',
      bg: 'default',
    };
  }
}

// Synchronous wrapper to match tng.js API
function processImage(
  file: string | Buffer,
  options: ImageOptions = {}
): ImageResult {
  const processor = new ModernImageProcessor(file, options);

  const result: ImageResult = {
    cellmap: processor.createCellmap(),
    frames: undefined, // GIF support would go here
    play: undefined,
    pause: undefined,
    stop: undefined,
    renderElement: undefined,
  };

  return result;
}

export = processImage;
