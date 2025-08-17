/**
 * scrollabletext.js - scrollable text element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import scrollableBox from './scrollablebox.js';

// Extract the ScrollableBox class from the factory function
const ScrollableBox = scrollableBox.ScrollableBox;

/**
 * Type definitions
 */

export interface ScrollableTextOptions {
  alwaysScroll?: boolean;
  [key: string]: any;
}

interface ScrollableTextInterface extends ScrollableBox {
  type: string;
}

/**
 * ScrollableText - Modern ES6 Class
 */

class ScrollableText extends ScrollableBox {
  type = 'scrollable-text';

  constructor(options?: ScrollableTextOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Always enable scrolling for scrollable text
    options.alwaysScroll = true;

    super(options);
  }
}

/**
 * Factory function for backward compatibility
 */
function scrollableText(
  options?: ScrollableTextOptions
): ScrollableTextInterface {
  return new ScrollableText(options) as ScrollableTextInterface;
}

// Attach the class as a property for direct access
scrollableText.ScrollableText = ScrollableText;

/**
 * Expose
 */

export default scrollableText;
