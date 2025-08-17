/**
 * box.js - box element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import BlessedNode from './node.js';
import BlessedElement from './element.js';

/**
 * Type definitions
 */

import { BoxOptions, BoxInterface } from '../types/index';

/**
 * Box - Modern ES6 Class
 */

class Box extends BlessedElement {
  type = 'box';

  constructor(options?: BoxOptions) {
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
function box(options?: BoxOptions): BoxInterface {
  return new Box(options) as BoxInterface;
}

// Attach the class as a property for direct access
box.Box = Box;

/**
 * Expose
 */

export default box;
