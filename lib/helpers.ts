/**
 * helpers.js - helpers for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as fs from 'fs';
import * as unicode from './unicode.js';

/**
 * Type definitions
 */

interface SortableItem {
  name: string;
}

interface IndexedItem {
  index: number;
}

interface Style {
  [key: string]: string | boolean;
}

interface TagResult {
  open: string;
  close: string;
}

interface Screen {
  global?: any;
}

interface Element {
  parseTags?: boolean;
  screen?: Screen;
  sattr?(style: any): any;
  _parseTags?(text: string): string;
}

/**
 * Helpers
 */

const helpers = {} as any;

// Placeholder for functions that will be added by blessed.ts
helpers.sprintf = null;
helpers.tryRead = null;

helpers.merge = function (a: any, b: any): any {
  Object.keys(b).forEach(function (key: string) {
    a[key] = b[key];
  });
  return a;
};

helpers.asort = function (obj: SortableItem[]): SortableItem[] {
  return obj.sort(function (a: SortableItem, b: SortableItem) {
    let aName = a.name.toLowerCase();
    let bName = b.name.toLowerCase();

    if (aName[0] === '.' && bName[0] === '.') {
      aName = aName[1];
      bName = bName[1];
    } else {
      aName = aName[0];
      bName = bName[0];
    }

    return aName > bName ? 1 : aName < bName ? -1 : 0;
  });
};

helpers.hsort = function (obj: IndexedItem[]): IndexedItem[] {
  return obj.sort(function (a: IndexedItem, b: IndexedItem) {
    return b.index - a.index;
  });
};

helpers.findFile = function (start: string, target: string): string | null {
  return (function read(dir: string): string | null {
    let files: string[], file: string, stat: any, out: string | null;

    if (dir === '/dev' || dir === '/sys' || dir === '/proc' || dir === '/net') {
      return null;
    }

    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      files = [];
    }

    for (let i = 0; i < files.length; i++) {
      file = files[i];

      if (file === target) {
        return (dir === '/' ? '' : dir) + '/' + file;
      }

      try {
        stat = fs.lstatSync((dir === '/' ? '' : dir) + '/' + file);
      } catch (e) {
        stat = null;
      }

      if (stat && stat.isDirectory() && !stat.isSymbolicLink()) {
        out = read((dir === '/' ? '' : dir) + '/' + file);
        if (out) return out;
      }
    }

    return null;
  })(start);
};

// Escape text for tag-enabled elements.
helpers.escape = function (text: string): string {
  return text.replace(/[{}]/g, function (ch: string) {
    return ch === '{' ? '{open}' : '{close}';
  });
};

helpers.parseTags = function (text: string, screen?: Screen): string {
  return helpers.Element.prototype._parseTags.call(
    { parseTags: true, screen: screen || helpers.Screen.global },
    text
  );
};

helpers.generateTags = function (
  style: Style | null,
  text?: string | null
): string | TagResult {
  let open = '';
  let close = '';

  Object.keys(style || {}).forEach(function (key: string) {
    let val = (style as Style)[key];
    if (typeof val === 'string') {
      val = val.replace(/^light(?!-)/, 'light-');
      val = val.replace(/^bright(?!-)/, 'bright-');
      open = '{' + val + '-' + key + '}' + open;
      close += '{/' + val + '-' + key + '}';
    } else {
      if (val === true) {
        open = '{' + key + '}' + open;
        close += '{/' + key + '}';
      }
    }
  });

  if (text != null) {
    return open + text + close;
  }

  return {
    open: open,
    close: close,
  };
};

helpers.attrToBinary = function (style: any, element?: Element): any {
  return helpers.Element.prototype.sattr.call(element || {}, style);
};

helpers.stripTags = function (text: string): string {
  if (!text) return '';
  return text
    .replace(/{(\/?)([\w\-,;!#]*)}/g, '')
    .replace(/\x1b\[[\d;]*m/g, '');
};

helpers.cleanTags = function (text: string): string {
  return helpers.stripTags(text).trim();
};

helpers.dropUnicode = function (text: string): string {
  if (!text) return '';
  return text
    .replace(unicode.chars.all, '??')
    .replace(unicode.chars.combining, '')
    .replace(unicode.chars.surrogate, '?');
};

Object.defineProperty(helpers, 'Screen', {
  get() {
    if (!helpers._screen) {
      helpers._screen = require('./widgets/screen');
    }
    return helpers._screen;
  },
  enumerable: true,
  configurable: true,
});

Object.defineProperty(helpers, 'Element', {
  get() {
    if (!helpers._element) {
      helpers._element = require('./widgets/element');
    }
    return helpers._element;
  },
  enumerable: true,
  configurable: true,
});

// Export individual functions for named imports
export const merge = helpers.merge;
export const asort = helpers.asort;
export const hsort = helpers.hsort;
export const findFile = helpers.findFile;
export const escape = helpers.escape;
export const parseTags = helpers.parseTags;
export const generateTags = helpers.generateTags;
export const attrToBinary = helpers.attrToBinary;
export const stripTags = helpers.stripTags;
export const cleanTags = helpers.cleanTags;
export const dropUnicode = helpers.dropUnicode;

// Make sure all named exports are also available on helpers object
Object.assign(helpers, {
  merge,
  asort,
  hsort,
  findFile,
  escape,
  parseTags,
  generateTags,
  attrToBinary,
  stripTags,
  cleanTags,
  dropUnicode,
});

export default helpers;
