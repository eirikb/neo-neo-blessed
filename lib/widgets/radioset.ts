/**
 * radioset.js - radio set element for blessed
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

interface RadioSetOptions {
  style?: any;
  [key: string]: any;
}

interface RadioSetInterface extends Box {
  type: string;
}

/**
 * RadioSet - Modern ES6 Class
 */

class RadioSet extends Box {
  type = 'radio-set';

  constructor(options?: RadioSetOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Possibly inherit parent's style.
    // options.style = this.parent.style;
    super(options);
  }
}

/**
 * Factory function for backward compatibility
 */
function radioSet(options?: RadioSetOptions): RadioSetInterface {
  return new RadioSet(options) as RadioSetInterface;
}

// Attach the class as a property for direct access
radioSet.RadioSet = RadioSet;

/**
 * Expose
 */

export default radioSet;
