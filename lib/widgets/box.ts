/**
 * box.js - box element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const BlessedNode = require('./node');
const BlessedElement = require('./element');

/**
 * Type definitions
 */

interface BoxOptions {
  [key: string]: any;
}

interface BoxInterface extends any {
  type: string;
}

/**
 * Box
 */

function Box(this: BoxInterface, options?: BoxOptions) {
  if (!(this instanceof BlessedNode)) {
    return new (Box as any)(options);
  }
  options = options || {};
  BlessedElement.call(this, options);
}

Box.prototype.__proto__ = BlessedElement.prototype;

Box.prototype.type = 'box';

/**
 * Expose
 */

module.exports = Box;
