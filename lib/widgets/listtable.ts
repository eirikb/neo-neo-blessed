/**
 * listtable.js - list table element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;
import listFactory from './list.js';
const List = listFactory.List;
import Table from './table.js';

/**
 * Type definitions
 */

interface ListTableOptions {
  normalShrink?: boolean;
  style?: {
    border?: { [key: string]: any };
    header?: { [key: string]: any };
    cell?: {
      [key: string]: any;
      selected?: { [key: string]: any };
    };
    [key: string]: any;
  };
  align?: 'left' | 'center' | 'right';
  border?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
    [key: string]: any;
  };
  parseTags?: boolean;
  tags?: boolean;
  pad?: number;
  rows?: string[][];
  data?: string[][];
  noCellBorders?: boolean;
  fillCellBorders?: boolean;
  [key: string]: any;
}

interface ListTableCoords {
  xi: number;
  xl: number;
  yi: number;
  yl: number;
}

interface ListTableLine {
  dirty?: boolean;
  [index: number]: [number, string];
}

interface ListTableScreen {
  lines: ListTableLine[];
  autoPadding?: boolean;
}

interface ListTableHeader {
  setFront(): void;
  setContent(content: string): void;
  rtop?: number;
}

interface ListTableInterface extends List {
  type: string;
  __align: 'left' | 'center' | 'right';
  _header: ListTableHeader;
  pad: number;
  rows: string[][];
  _maxes?: number[];
  border?: any;
  options: ListTableOptions;
  screen: ListTableScreen;
  childBase: number;
  ibottom: number;
  ileft: number;
  visible?: boolean;
  lpos?: any;
  selected: number;
  items: any[];
  ritems: string[];
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  clearPos(): void;
  clearItems(): void;
  addItem(item: string): void;
  strWidth(str: string): number;
  setScroll(offset: number): void;
  scrollTo(index: number): void;
  sattr(style: any): number;
  _calculateMaxes(): void;
  setRows(rows: string[][]): void;
  setData(rows: string[][]): void;
  _select(index: number): void;
  select(index: number): void;
  render(): ListTableCoords | undefined;
  _render(): ListTableCoords | undefined;
}

/**
 * ListTable - Modern ES6 Class
 */

class ListTable extends List {
  type = 'list-table';
  __align: 'left' | 'center' | 'right';
  _header: ListTableHeader;
  pad: number;
  rows: string[][];
  _maxes?: number[];

  constructor(options?: ListTableOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Prepare options for List constructor
    options.normalShrink = true;
    options.style = options.style || {};
    options.style.border = options.style.border || {};
    options.style.header = options.style.header || {};
    options.style.cell = options.style.cell || {};

    // Store alignment and remove from options before passing to parent
    const align = options.align || 'center';
    delete options.align;

    // Set up cell styles for list selection
    options.style.selected = options.style.cell!.selected;
    options.style.item = options.style.cell;

    // Handle border options
    const border = options.border;
    if (
      border &&
      border.top === false &&
      border.bottom === false &&
      border.left === false &&
      border.right === false
    ) {
      delete options.border;
    }

    super(options);

    // Restore border after parent constructor
    this.options.border = border;

    // Initialize listtable-specific properties
    this.__align = align;
    this.pad = options.pad != null ? options.pad : 2;
    this.rows = [];

    // Create header element
    this._header = new Box({
      parent: this,
      left: this.screen.autoPadding ? 0 : this.ileft,
      top: 0,
      width: 'shrink',
      height: 1,
      style: options.style.header,
      tags: options.parseTags || options.tags,
    });

    // Set up event handlers
    this.on('scroll', () => {
      this._header.setFront();
      this._header.rtop = this.childBase;
      if (!this.screen.autoPadding) {
        this._header.rtop = this.childBase + (this.border ? 1 : 0);
      }
    });

    this.on('attach', () => {
      this.setData(this.rows);
    });

    this.on('resize', () => {
      const selected = this.selected;
      this.setData(this.rows);
      this.select(selected);
      this.screen.render();
    });

    // Initialize with data if provided
    this.setData(options.rows || options.data);
  }

  _calculateMaxes(): void {
    // Use Table's _calculateMaxes implementation
    const tableProto = Table.prototype as any;
    if (tableProto._calculateMaxes) {
      this._maxes = tableProto._calculateMaxes.call(this);
    }
  }

  setRows(rows?: string[][]): void {
    this.setData(rows);
  }

  setData(rows?: string[][]): void {
    const align = this.__align;
    const selected = this.selected;
    const original = this.items.slice();
    let sel = this.ritems[this.selected];

    if (this.visible && this.lpos) {
      this.clearPos();
    }

    this.clearItems();

    this.rows = rows || [];

    this._calculateMaxes();

    if (!this._maxes) return;

    this.addItem('');

    this.rows.forEach((row: string[], i: number) => {
      const isHeader = i === 0;
      let text = '';
      row.forEach((cell: string, i: number) => {
        const width = this._maxes![i];
        let clen = this.strWidth(cell);

        if (i !== 0) {
          text += ' ';
        }

        while (clen < width) {
          if (align === 'center') {
            cell = ' ' + cell + ' ';
            clen += 2;
          } else if (align === 'left') {
            cell = cell + ' ';
            clen += 1;
          } else if (align === 'right') {
            cell = ' ' + cell;
            clen += 1;
          }
        }

        if (clen > width) {
          if (align === 'center') {
            cell = cell.substring(1);
            clen--;
          } else if (align === 'left') {
            cell = cell.slice(0, -1);
            clen--;
          } else if (align === 'right') {
            cell = cell.substring(1);
            clen--;
          }
        }

        text += cell;
      });
      if (isHeader) {
        this._header.setContent(text);
      } else {
        this.addItem(text);
      }
    });

    this._header.setFront();

    // Try to find our old item if it still exists.
    sel = this.ritems.indexOf(sel);
    if (~sel) {
      this.select(sel);
    } else if (this.items.length === original.length) {
      this.select(selected);
    } else {
      this.select(Math.min(selected, this.items.length - 1));
    }
  }

  select(i: number): void {
    if (i === 0) {
      i = 1;
    }
    if (i <= this.childBase) {
      this.setScroll(this.childBase - 1);
    }
    super.select(i);
    // Correct scrolling for header offset.
    this.scrollTo(this.selected - 1);
    if (this.rows && this.selected) {
      this.emit('selectrow', this.rows[this.selected], this.selected);
    }
  }

  render(): ListTableCoords | undefined {
    const coords = this._render();
    if (!coords) return;

    this._calculateMaxes();

    if (!this._maxes) return coords;

    const lines = this.screen.lines;
    const xi = coords.xi;
    const yi = coords.yi;
    let rx: number;
    let ry: number;
    let i: number;

    const battr = this.sattr(this.style.border);

    const height = coords.yl - coords.yi - this.ibottom;

    let border = this.border;
    if (!this.border && this.options.border) {
      border = this.options.border;
    }

    if (!border || this.options.noCellBorders) return coords;

    // Draw border with correct angles.
    ry = 0;
    for (i = 0; i < height + 1; i++) {
      if (!lines[yi + ry]) break;
      rx = 0;
      this._maxes!.slice(0, -1).forEach((max: number) => {
        rx += max;
        if (!lines[yi + ry][xi + rx + 1]) return;
        // center
        if (ry === 0) {
          // top
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          lines[yi + ry][xi + rx][1] = '\u252c'; // '┬'
          // XXX If we alter iheight and itop for no borders - nothing should be written here
          if (!border.top) {
            lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
          }
          lines[yi + ry].dirty = true;
        } else if (ry === height) {
          // bottom
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          lines[yi + ry][xi + rx][1] = '\u2534'; // '┴'
          // XXX If we alter iheight and ibottom for no borders - nothing should be written here
          if (!border.bottom) {
            lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
          }
          lines[yi + ry].dirty = true;
        } else {
          // middle
          rx++;
        }
      });
      ry += 1;
    }

    // Draw internal borders.
    for (ry = 1; ry < height; ry++) {
      if (!lines[yi + ry]) break;
      rx = 0;
      this._maxes!.slice(0, -1).forEach((max: number) => {
        rx += max;
        if (!lines[yi + ry][xi + rx + 1]) return;
        if (this.options.fillCellBorders !== false) {
          const lbg = lines[yi + ry][xi + rx][0] & 0x1ff;
          rx++;
          lines[yi + ry][xi + rx][0] = (battr & ~0x1ff) | lbg;
        } else {
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
        }
        lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        lines[yi + ry].dirty = true;
      });
    }

    return coords;
  }
}

/**
 * Factory function for backward compatibility
 */
function listTable(options?: ListTableOptions): ListTableInterface {
  return new ListTable(options) as ListTableInterface;
}

// Attach the class as a property for direct access
listTable.ListTable = ListTable;

/**
 * Expose
 */

export default listTable;
