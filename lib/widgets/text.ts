/**
 * text.js - text element for blessed
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

interface TextOptions {
  shrink?: boolean | string;
  [key: string]: any;
}

interface TextInterface extends Element {
  type: string;
}

/**
 * Text
 */

function Text(this: TextInterface, options?: TextOptions) {
  if (!(this instanceof Node)) {
    return new (Text as any)(options);
  }
  options = options || {};
  options.shrink = 'shrink' in options ? options.shrink : true;
  Element.call(this, options);
}

Text.prototype.__proto__ = Element.prototype;

Text.prototype.type = 'text';

/**
 * Expose
 */

module.exports = Text;
