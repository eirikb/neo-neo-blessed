/**
 * scrollabletext.js - scrollable text element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const ScrollableBox = require('./scrollablebox');

/**
 * Type definitions
 */

interface ScrollableTextOptions {
  alwaysScroll?: boolean;
  [key: string]: any;
}

interface ScrollableTextInterface extends ScrollableBox {
  type: string;
}

/**
 * ScrollableText
 */

function ScrollableText(this: ScrollableTextInterface, options?: ScrollableTextOptions) {
  if (!(this instanceof Node)) {
    return new (ScrollableText as any)(options);
  }
  options = options || {};
  options.alwaysScroll = true;
  ScrollableBox.call(this, options);
}

ScrollableText.prototype.__proto__ = ScrollableBox.prototype;

ScrollableText.prototype.type = 'scrollable-text';

/**
 * Expose
 */

module.exports = ScrollableText;