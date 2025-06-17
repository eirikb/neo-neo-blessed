/**
 * radioset.js - radio set element for blessed
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

interface RadioSetOptions {
  style?: any;
  [key: string]: any;
}

interface RadioSetInterface extends Box {
  type: string;
}

/**
 * RadioSet
 */

function RadioSet(this: RadioSetInterface, options?: RadioSetOptions) {
  if (!(this instanceof Node)) {
    return new (RadioSet as any)(options);
  }
  options = options || {};
  // Possibly inherit parent's style.
  // options.style = this.parent.style;
  Box.call(this, options);
}

RadioSet.prototype.__proto__ = Box.prototype;

RadioSet.prototype.type = 'radio-set';

/**
 * Expose
 */

module.exports = RadioSet;