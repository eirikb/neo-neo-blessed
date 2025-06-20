/**
 * input.js - abstract input element for blessed
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

interface InputOptions {
  [key: string]: any;
}

interface InputInterface extends Box {
  type: string;
}

/**
 * Input
 */

function Input(this: InputInterface, options?: InputOptions) {
  if (!(this instanceof Node)) {
    return new (Input as any)(options);
  }
  options = options || {};
  Box.call(this, options);
}

Input.prototype.__proto__ = Box.prototype;

Input.prototype.type = 'input';

/**
 * Expose
 */

module.exports = Input;