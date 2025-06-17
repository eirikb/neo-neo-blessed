/**
 * box.js - box element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Element = require('./element');

/**
 * Type definitions
 */

interface BoxOptions {
  [key: string]: any;
}

interface BoxInterface extends Element {
  type: string;
}

/**
 * Box
 */

function Box(this: BoxInterface, options?: BoxOptions) {
  if (!(this instanceof Node)) {
    return new (Box as any)(options);
  }
  options = options || {};
  Element.call(this, options);
}

Box.prototype.__proto__ = Element.prototype;

Box.prototype.type = 'box';

/**
 * Expose
 */

module.exports = Box;