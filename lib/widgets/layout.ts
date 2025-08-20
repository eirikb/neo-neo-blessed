/**
 * layout.js - layout element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import Element from './element.js';

/**
 * Type definitions
 */

interface LayoutOptions {
  width?: number;
  height?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  layout?: 'inline' | 'grid';
  renderer?: (coords: LayoutCoords) => LayoutIterator;
  [key: string]: any;
}

interface LayoutCoords {
  xi: number;
  xl: number;
  yi: number;
  yl: number;
}

interface LayoutPosition {
  left: number;
  top: number;
  width?: number;
}

interface LayoutPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface LayoutChild {
  shrink?: boolean;
  width: number;
  height: number;
  position: LayoutPosition;
  lpos?: LayoutCoords;
  index?: number;
  screen: {
    _ci: number;
  };
  render(): void;
}

interface LayoutIterator {
  (el: LayoutChild, i: number): boolean | void;
}

interface LayoutInterface extends Element {
  type: string;
  options: LayoutOptions;
  children: LayoutChild[];
  lpos?: LayoutCoords;
  border?: boolean;
  tpadding?: boolean;
  padding?: LayoutPadding;
  renderer: (coords: LayoutCoords) => LayoutIterator;
  isRendered(el: LayoutChild): boolean;
  getLast(i: number): LayoutChild | undefined;
  getLastCoords(i: number): LayoutCoords | undefined;
  _renderCoords(): LayoutCoords | undefined;
  render(): LayoutCoords | undefined;
  _emit(event: string, args?: any[]): void;
  _getCoords(get?: boolean): LayoutCoords | undefined;
  _render(): any;
}

/**
 * Layout - Modern ES6 Class
 */

class Layout extends Element {
  type = 'layout';
  options: LayoutOptions;
  lpos?: LayoutCoords;
  border?: boolean;
  tpadding?: boolean;
  padding?: LayoutPadding;

  constructor(options?: LayoutOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Validate required dimensions
    if (
      (options.width == null &&
        options.left == null &&
        options.right == null) ||
      (options.height == null && options.top == null && options.bottom == null)
    ) {
      throw new Error('`Layout` must have a width and height!');
    }

    // Set default layout type
    options.layout = options.layout || 'inline';

    super(options);

    this.options = options;

    // Ensure padding is properly initialized (fallback for inheritance issues)
    if (!this.padding) {
      this.padding = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      };
    }

    // Set custom renderer if provided
    if (options.renderer) {
      this.renderer = options.renderer;
    }
  }

  isRendered(el: LayoutChild): boolean {
    if (!el.lpos) return false;
    return el.lpos.xl - el.lpos.xi > 0 && el.lpos.yl - el.lpos.yi > 0;
  }

  getLast(i: number): LayoutChild | undefined {
    while (this.children[--i]) {
      const el = this.children[i];
      if (this.isRendered(el)) return el;
    }
  }

  getLastCoords(i: number): LayoutCoords | undefined {
    const last = this.getLast(i);
    if (last) return last.lpos;
  }

  _renderCoords(): LayoutCoords | undefined {
    const coords = this._getCoords(true);
    const children = this.children;
    this.children = [];
    this._render();
    this.children = children;
    return coords;
  }

  renderer(coords: LayoutCoords): LayoutIterator {
    const self = this;

    // The coordinates of the layout element
    const width = coords.xl - coords.xi;
    const height = coords.yl - coords.yi;
    const xi = coords.xi;
    const yi = coords.yi;

    // The current row offset in cells (which row are we on?)
    let rowOffset = 0;

    // The index of the first child in the row
    let rowIndex = 0;
    let lastRowIndex = 0;

    // Figure out the highest width child
    let highWidth = 0;
    if (this.options.layout === 'grid') {
      highWidth = this.children.reduce(function (
        out: number,
        el: LayoutChild
      ): number {
        out = Math.max(out, el.width);
        return out;
      }, 0);
    }

    return function iterator(el: LayoutChild, i: number): boolean | void {
      // Make our children shrinkable. If they don't have a height, for
      // example, calculate it for them.
      el.shrink = true;

      // Find the previous rendered child's coordinates
      const last = self.getLast(i);

      // If there is no previously rendered element, we are on the first child.
      if (!last) {
        el.position.left = 0;
        el.position.top = 0;
      } else {
        // Otherwise, figure out where to place this child. We'll start by
        // setting it's `left`/`x` coordinate to right after the previous
        // rendered element. This child will end up directly to the right of it.
        el.position.left = last.lpos!.xl - xi;

        // Make sure the position matches the highest width element
        if (self.options.layout === 'grid') {
          // Compensate with width:
          // el.position.width = el.width + (highWidth - el.width);
          // Compensate with position:
          el.position.left += highWidth - (last.lpos!.xl - last.lpos!.xi);
        }

        // If our child does not overlap the right side of the Layout, set it's
        // `top`/`y` to the current `rowOffset` (the coordinate for the current
        // row).
        if (el.position.left + el.width <= width) {
          el.position.top = rowOffset;
        } else {
          // Otherwise we need to start a new row and calculate a new
          // `rowOffset` and `rowIndex` (the index of the child on the current
          // row).
          rowOffset += self.children.slice(rowIndex, i).reduce(function (
            out: number,
            el: LayoutChild
          ): number {
            if (!self.isRendered(el)) return out;
            out = Math.max(out, el.lpos!.yl - el.lpos!.yi);
            return out;
          }, 0);
          lastRowIndex = rowIndex;
          rowIndex = i;
          el.position.left = 0;
          el.position.top = rowOffset;
        }
      }

      // Make sure the elements on lower rows graviatate up as much as possible
      if (self.options.layout === 'inline') {
        let above: LayoutChild | null = null;
        let abovea = Infinity;
        for (let j = lastRowIndex; j < rowIndex; j++) {
          const l = self.children[j];
          if (!self.isRendered(l)) continue;
          const abs = Math.abs(el.position.left - (l.lpos!.xi - xi));
          // if (abs < abovea && (l.lpos.xl - l.lpos.xi) <= el.width) {
          if (abs < abovea) {
            above = l;
            abovea = abs;
          }
        }
        if (above) {
          el.position.top = above.lpos!.yl - yi;
        }
      }

      // If our child overflows the Layout, do not render it!
      // Disable this feature for now.
      if (el.position.top + el.height > height) {
        // Returning false tells blessed to ignore this child.
        // return false;
      }
    };
  }

  render(): LayoutCoords | undefined {
    this._emit('prerender');

    const coords = this._renderCoords();
    if (!coords) {
      delete this.lpos;
      return;
    }

    if (coords.xl - coords.xi <= 0) {
      coords.xl = Math.max(coords.xl, coords.xi);
      return;
    }

    if (coords.yl - coords.yi <= 0) {
      coords.yl = Math.max(coords.yl, coords.yi);
      return;
    }

    this.lpos = coords;

    if (this.border) coords.xi++, coords.xl--, coords.yi++, coords.yl--;
    if (this.tpadding) {
      (coords.xi += this.padding!.left), (coords.xl -= this.padding!.right);
      (coords.yi += this.padding!.top), (coords.yl -= this.padding!.bottom);
    }

    const iterator = this.renderer(coords);

    if (this.border) coords.xi--, coords.xl++, coords.yi--, coords.yl++;
    if (this.tpadding) {
      (coords.xi -= this.padding!.left), (coords.xl += this.padding!.right);
      (coords.yi -= this.padding!.top), (coords.yl += this.padding!.bottom);
    }

    this.children.forEach(function (el: LayoutChild, i: number) {
      if (el.screen._ci !== -1) {
        el.index = el.screen._ci++;
      }
      const rendered = iterator(el, i);
      if (rendered === false) {
        delete el.lpos;
        return;
      }
      // if (el.screen._rendering) {
      //   el._rendering = true;
      // }
      el.render();
      // if (el.screen._rendering) {
      //   el._rendering = false;
      // }
    });

    this._emit('render', [coords]);

    return coords;
  }
}

/**
 * Factory function for backward compatibility
 */
function layout(options?: LayoutOptions): LayoutInterface {
  return new Layout(options) as LayoutInterface;
}

// Attach the class as a property for direct access
layout.Layout = Layout;

/**
 * Expose
 */

export default layout;
