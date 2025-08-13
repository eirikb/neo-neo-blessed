/**
 * line.js - line element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Box = require('./box');

/**
 * Type definitions
 */

interface LineOptions {
  orientation?: 'vertical' | 'horizontal';
  type?: string;
  ch?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

interface Border {
  type: string;
  __proto__: any;
}

interface LineInterface extends Box {
  type: string;
  ch: string;
  border: Border;
  style: any;
}

/**
 * Line
 */

function Line(this: LineInterface, options?: LineOptions) {
  if (!(this instanceof Node)) {
    return new (Line as any)(options);
  }

  options = options || {};

  const orientation = options.orientation || 'vertical';
  delete options.orientation;

  if (orientation === 'vertical') {
    options.width = 1;
  } else {
    options.height = 1;
  }

  Box.call(this, options);

  this.ch =
    !options.type || options.type === 'line'
      ? orientation === 'horizontal'
        ? '─'
        : '│'
      : options.ch || ' ';

  this.border = {
    type: 'bg',
    __proto__: this,
  };

  this.style.border = this.style;
}

Line.prototype.__proto__ = Box.prototype;

Line.prototype.type = 'line';

/**
 * Expose
 */

module.exports = Line;
