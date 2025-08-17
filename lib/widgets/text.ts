/**
 * text.js - text element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import Element from './element.js';

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
 * Text - Modern ES6 Class
 */

class Text extends Element {
  type = 'text';

  constructor(options?: TextOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Set default shrink behavior for text (key Text feature)
    options.shrink = 'shrink' in options ? options.shrink : true;

    super(options);
  }
}

/**
 * Factory function for backward compatibility
 */
function text(options?: TextOptions): TextInterface {
  return new Text(options) as TextInterface;
}

// Attach the class as a property for direct access
text.Text = Text;

/**
 * Expose
 */

export default text;
