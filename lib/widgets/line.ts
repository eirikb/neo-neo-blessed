/**
 * line.js - line element for blessed
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
 * Line - Modern ES6 Class
 */

class Line extends Box {
  type = 'line';
  ch: string;
  border: Border;

  constructor(options?: LineOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    const orientation = options.orientation || 'vertical';

    // Create a copy of options to avoid modifying the original
    const lineOptions = { ...options };
    delete lineOptions.orientation;

    // Set dimensions based on orientation
    if (orientation === 'vertical') {
      lineOptions.width = 1;
    } else {
      lineOptions.height = 1;
    }

    super(lineOptions);

    // Set the character based on orientation and type
    this.ch =
      !options.type || options.type === 'line'
        ? orientation === 'horizontal'
          ? '─'
          : '│'
        : options.ch || ' ';

    // Set up border configuration
    this.border = {
      type: 'bg',
      __proto__: this,
    };

    // Configure border style
    this.style.border = this.style;
  }
}

/**
 * Factory function for backward compatibility
 */
function line(options?: LineOptions): LineInterface {
  return new Line(options) as LineInterface;
}

// Attach the class as a property for direct access
line.Line = Line;

/**
 * Expose
 */

export default line;
