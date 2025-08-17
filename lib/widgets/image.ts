/**
 * image.js - image element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;
import ansiimage from './ansiimage.js';
import overlayimage from './overlayimage.js';

/**
 * Interfaces
 */

interface ImageOptions {
  type?: 'ansi' | 'overlay';
  itype?: 'ansi' | 'overlay';
  [key: string]: any;
}

interface ImageInterface extends Box {
  type: string;
}

/**
 * Image - Modern ES6 Class
 */

class Image extends Box {
  type = 'image';

  constructor(options?: ImageOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Set image type with fallback to 'ansi'
    options.type = options.itype || options.type || 'ansi';

    super(options);

    // Handle image type delegation with ES6 classes
    if (options.type === 'ansi' && this.type !== 'ansiimage') {
      // Return a new ANSIImage instance instead of prototype manipulation
      return new ansiimage.ANSIImage(options) as any;
    }

    if (options.type === 'overlay' && this.type !== 'overlayimage') {
      // Return a new OverlayImage instance instead of prototype manipulation
      return new overlayimage.OverlayImage(options) as any;
    }

    throw new Error('`type` must either be `ansi` or `overlay`.');
  }
}

/**
 * Factory function for backward compatibility
 */
function image(options?: ImageOptions): ImageInterface {
  return new Image(options) as ImageInterface;
}

// Attach the class as a property for direct access
image.Image = Image;

/**
 * Expose
 */

export default image;
