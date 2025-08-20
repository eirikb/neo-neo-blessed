/**
 * input.js - abstract input element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;

/**
 * Type definitions
 */

export interface InputOptions {
  [key: string]: any;
}

interface InputInterface extends Box {
  type: string;
}

/**
 * Input - Modern ES6 Class
 */

class Input extends Box {
  type = 'input';

  constructor(options?: InputOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);
  }
}

/**
 * Factory function for backward compatibility
 */
function input(options?: InputOptions): InputInterface {
  return new Input(options) as InputInterface;
}

// Attach the class as a property for direct access
input.Input = Input;

/**
 * Expose
 */

export default input;
