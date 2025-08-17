/**
 * overlayimage.js - w3m image element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as fs from 'fs';
import * as cp from 'child_process';
import { spawn } from 'child_process';

import * as helpers from '../helpers.js';

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;

/**
 * Interfaces
 */

interface OverlayImageOptions {
  w3m?: string;
  search?: boolean;
  file?: string;
  img?: string;
  shrink?: boolean;
  autofit?: boolean;
  [key: string]: any;
}

interface ImageSize {
  raw: string;
  width: number;
  height: number;
}

interface PixelRatio {
  tw: number;
  th: number;
}

interface ImageProps {
  aleft: number;
  atop: number;
  width: number;
  height: number;
}

interface LastSize {
  tw: number;
  th: number;
  width: number;
  height: number;
  aleft: number;
  atop: number;
}

interface OverlayImageScreen {
  width: number;
  height: number;
  program: {
    flush(): void;
  };
  render(): void;
  displayImage(file: string, callback?: Function): any;
}

interface OverlayImagePosition {
  width?: number;
  height?: number;
  [key: string]: any;
}

interface OverlayImageInterface extends Box {
  type: string;
  file?: string;
  _lastFile?: string;
  _needsRatio?: boolean;
  _noImage?: boolean;
  _settingImage?: boolean;
  _queue?: [string, Function?][];
  _props?: ImageProps;
  _lastSize?: LastSize;
  _ratio?: PixelRatio;
  _drag?: boolean;
  screen: OverlayImageScreen;
  options: OverlayImageOptions;
  position: OverlayImagePosition;
  width: number;
  height: number;
  aleft: number;
  atop: number;
  shrink?: boolean;

  // Methods
  spawn(file: string, args: string[], opt?: any, callback?: Function): any;
  setImage(img: string, callback?: Function): any;
  renderImage(img: string, ratio: PixelRatio, callback?: Function): any;
  clearImage(callback?: Function): any;
  imageSize(callback?: Function): any;
  termSize(callback?: Function): any;
  getPixelRatio(callback?: Function): any;
  renderImageSync(img: string, ratio: PixelRatio): boolean;
  clearImageSync(): boolean;
  imageSizeSync(): ImageSize;
  termSizeSync(unused?: any, recurse?: number): ImageSize;
  getPixelRatioSync(): PixelRatio;
  displayImage(callback?: Function): any;
  onScreenEvent(event: string, listener: Function): void;
}

/**
 * OverlayImage - Modern ES6 Class
 * Good example of w3mimgdisplay commands:
 * https://github.com/hut/ranger/blob/master/ranger/ext/img_display.py
 */

class OverlayImage extends Box {
  type = 'overlayimage';

  // Static properties
  static w3mdisplay = '/usr/lib/w3m/w3mimgdisplay';
  static hasW3MDisplay: boolean | null = null;

  // Instance properties
  file?: string;
  _lastFile?: string;
  _needsRatio?: boolean;
  _noImage?: boolean;
  _settingImage?: boolean;
  _queue?: [string, Function?][];
  _props?: ImageProps;
  _lastSize?: LastSize;
  _ratio?: PixelRatio;
  _drag?: boolean;
  shrink?: boolean;

  constructor(options?: OverlayImageOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    // Setup w3m display path
    if (options.w3m) {
      OverlayImage.w3mdisplay = options.w3m;
    }

    // Initialize w3m display availability
    if (OverlayImage.hasW3MDisplay == null) {
      if (fs.existsSync(OverlayImage.w3mdisplay)) {
        OverlayImage.hasW3MDisplay = true;
      } else if (options.search !== false) {
        var file =
          helpers.findFile('/usr', 'w3mimgdisplay') ||
          helpers.findFile('/lib', 'w3mimgdisplay') ||
          helpers.findFile('/bin', 'w3mimgdisplay');
        if (file) {
          OverlayImage.hasW3MDisplay = true;
          OverlayImage.w3mdisplay = file;
        } else {
          OverlayImage.hasW3MDisplay = false;
        }
      }
    }

    // Setup event handlers
    this.on('hide', () => {
      this._lastFile = this.file;
      this.clearImage();
    });

    this.on('show', () => {
      if (!this._lastFile) return;
      this.setImage(this._lastFile);
    });

    this.on('detach', () => {
      this._lastFile = this.file;
      this.clearImage();
    });

    this.on('attach', () => {
      if (!this._lastFile) return;
      this.setImage(this._lastFile);
    });

    this.onScreenEvent('resize', () => {
      this._needsRatio = true;
    });

    // Get images to overlap properly. Maybe not worth it:
    // this.onScreenEvent('render', function() {
    //   self.screen.program.flush();
    //   if (!self._noImage) return;
    //   function display(el, next) {
    //     if (el.type === 'w3mimage' && el.file) {
    //       el.setImage(el.file, next);
    //     } else {
    //       next();
    //     }
    //   }
    //   function done(el) {
    //     el.children.forEach(recurse);
    //   }
    //   function recurse(el) {
    //     display(el, function() {
    //       var pending = el.children.length;
    //       el.children.forEach(function(el) {
    //         display(el, function() {
    //           if (!--pending) done(el);
    //         });
    //       });
    //     });
    //   }
    //   recurse(self.screen);
    // });

    this.onScreenEvent('render', () => {
      this.screen.program.flush();
      if (!this._noImage) {
        this.setImage(this.file);
      }
    });

    // Initialize image if provided
    if (this.options.file || this.options.img) {
      this.setImage(this.options.file || this.options.img);
    }
  }

  spawn(file: string, args: string[], opt?: any, callback?: Function) {
    opt = opt || {};
    const ps = spawn(file, args, opt);

    ps.on('error', function (err) {
      if (!callback) return;
      return callback(err);
    });

    ps.on('exit', function (code) {
      if (!callback) return;
      if (code !== 0) return callback(new Error('Exit Code: ' + code));
      return callback(null, code === 0);
    });

    return ps;
  }

  setImage(img: string, callback?: Function) {
    if (this._settingImage) {
      this._queue = this._queue || [];
      this._queue.push([img, callback]);
      return;
    }
    this._settingImage = true;

    const reset = () => {
      this._settingImage = false;
      this._queue = this._queue || [];
      var item = this._queue.shift();
      if (item) {
        this.setImage(item[0], item[1]);
      }
    };

    if (OverlayImage.hasW3MDisplay === false) {
      reset();
      if (!callback) return;
      return callback(new Error('W3M Image Display not available.'));
    }

    if (!img) {
      reset();
      if (!callback) return;
      return callback(new Error('No image.'));
    }

    this.file = img;

    return this.getPixelRatio((err, ratio) => {
      if (err) {
        reset();
        if (!callback) return;
        return callback(err);
      }

      return this.renderImage(img, ratio, (err, success) => {
        if (err) {
          reset();
          if (!callback) return;
          return callback(err);
        }

        if (this.shrink || this.options.autofit) {
          delete this.shrink;
          delete this.options.shrink;
          this.options.autofit = true;
          return this.imageSize((err, size) => {
            if (err) {
              reset();
              if (!callback) return;
              return callback(err);
            }

            if (
              this._lastSize &&
              ratio.tw === this._lastSize.tw &&
              ratio.th === this._lastSize.th &&
              size.width === this._lastSize.width &&
              size.height === this._lastSize.height &&
              this.aleft === this._lastSize.aleft &&
              this.atop === this._lastSize.atop
            ) {
              reset();
              if (!callback) return;
              return callback(null, success);
            }

            this._lastSize = {
              tw: ratio.tw,
              th: ratio.th,
              width: size.width,
              height: size.height,
              aleft: this.aleft,
              atop: this.atop,
            };

            this.position.width = (size.width / ratio.tw) | 0;
            this.position.height = (size.height / ratio.th) | 0;

            this._noImage = true;
            this.screen.render();
            this._noImage = false;

            reset();
            return this.renderImage(img, ratio, callback);
          });
        }

        reset();
        if (!callback) return;
        return callback(null, success);
      });
    });
  }

  renderImage(img: string, ratio: PixelRatio, callback?: Function) {
    if (cp.execSync) {
      callback =
        callback ||
        function (err, result) {
          return result;
        };
      try {
        return callback(null, this.renderImageSync(img, ratio));
      } catch (e) {
        return callback(e);
      }
    }

    if (OverlayImage.hasW3MDisplay === false) {
      if (!callback) return;
      return callback(new Error('W3M Image Display not available.'));
    }

    if (!ratio) {
      if (!callback) return;
      return callback(new Error('No ratio.'));
    }

    // clearImage unsets these:
    var _file = this.file;
    var _lastSize = this._lastSize;
    return this.clearImage(err => {
      if (err) return callback(err);

      this.file = _file;
      this._lastSize = _lastSize;

      var opt = {
        stdio: 'pipe',
        env: process.env,
        cwd: process.env.HOME,
      };

      var ps = this.spawn(
        OverlayImage.w3mdisplay,
        [],
        opt,
        function (err, success) {
          if (!callback) return;
          return err ? callback(err) : callback(null, success);
        }
      );

      var width = (this.width * ratio.tw) | 0,
        height = (this.height * ratio.th) | 0,
        aleft = (this.aleft * ratio.tw) | 0,
        atop = (this.atop * ratio.th) | 0;

      var input =
        '0;1;' +
        aleft +
        ';' +
        atop +
        ';' +
        width +
        ';' +
        height +
        ';;;;;' +
        img +
        '\n4;\n3;\n';

      this._props = {
        aleft: aleft,
        atop: atop,
        width: width,
        height: height,
      };

      ps.stdin.write(input);
      ps.stdin.end();
    });
  }

  clearImage(callback?: Function) {
    if (cp.execSync) {
      callback =
        callback ||
        function (err, result) {
          return result;
        };
      try {
        return callback(null, this.clearImageSync());
      } catch (e) {
        return callback(e);
      }
    }

    if (OverlayImage.hasW3MDisplay === false) {
      if (!callback) return;
      return callback(new Error('W3M Image Display not available.'));
    }

    if (!this._props) {
      if (!callback) return;
      return callback(null);
    }

    var opt = {
      stdio: 'pipe',
      env: process.env,
      cwd: process.env.HOME,
    };

    var ps = this.spawn(
      OverlayImage.w3mdisplay,
      [],
      opt,
      function (err, success) {
        if (!callback) return;
        return err ? callback(err) : callback(null, success);
      }
    );

    var width = this._props.width + 2,
      height = this._props.height + 2,
      aleft = this._props.aleft,
      atop = this._props.atop;

    if (this._drag) {
      aleft -= 10;
      atop -= 10;
      width += 10;
      height += 10;
    }

    var input =
      '6;' + aleft + ';' + atop + ';' + width + ';' + height + '\n4;\n3;\n';

    delete this.file;
    delete this._props;
    delete this._lastSize;

    ps.stdin.write(input);
    ps.stdin.end();
  }

  imageSize(callback?: Function) {
    var img = this.file;

    if (cp.execSync) {
      callback =
        callback ||
        function (err, result) {
          return result;
        };
      try {
        return callback(null, this.imageSizeSync());
      } catch (e) {
        return callback(e);
      }
    }

    if (OverlayImage.hasW3MDisplay === false) {
      if (!callback) return;
      return callback(new Error('W3M Image Display not available.'));
    }

    if (!img) {
      if (!callback) return;
      return callback(new Error('No image.'));
    }

    var opt = {
      stdio: 'pipe',
      env: process.env,
      cwd: process.env.HOME,
    };

    var ps = this.spawn(OverlayImage.w3mdisplay, [], opt);

    var buf = '';

    ps.stdout.setEncoding('utf8');

    ps.stdout.on('data', function (data) {
      buf += data;
    });

    ps.on('error', function (err) {
      if (!callback) return;
      return callback(err);
    });

    ps.on('exit', function () {
      if (!callback) return;
      var size = buf.trim().split(/\s+/);
      return callback(null, {
        raw: buf.trim(),
        width: +size[0],
        height: +size[1],
      });
    });

    var input = '5;' + img + '\n';

    ps.stdin.write(input);
    ps.stdin.end();
  }

  termSize(callback?: Function) {
    if (cp.execSync) {
      callback =
        callback ||
        function (err, result) {
          return result;
        };
      try {
        return callback(null, this.termSizeSync());
      } catch (e) {
        return callback(e);
      }
    }

    if (OverlayImage.hasW3MDisplay === false) {
      if (!callback) return;
      return callback(new Error('W3M Image Display not available.'));
    }

    var opt = {
      stdio: 'pipe',
      env: process.env,
      cwd: process.env.HOME,
    };

    var ps = this.spawn(OverlayImage.w3mdisplay, ['-test'], opt);

    var buf = '';

    ps.stdout.setEncoding('utf8');

    ps.stdout.on('data', function (data) {
      buf += data;
    });

    ps.on('error', function (err) {
      if (!callback) return;
      return callback(err);
    });

    ps.on('exit', () => {
      if (!callback) return;

      if (!buf.trim()) {
        // Bug: w3mimgdisplay will sometimes
        // output nothing. Try again:
        return this.termSize(callback);
      }

      var size = buf.trim().split(/\s+/);

      return callback(null, {
        raw: buf.trim(),
        width: +size[0],
        height: +size[1],
      });
    });

    ps.stdin.end();
  }

  getPixelRatio(callback?: Function) {
    if (cp.execSync) {
      callback =
        callback ||
        function (err, result) {
          return result;
        };
      try {
        return callback(null, this.getPixelRatioSync());
      } catch (e) {
        return callback(e);
      }
    }

    // XXX We could cache this, but sometimes it's better
    // to recalculate to be pixel perfect.
    if (this._ratio && !this._needsRatio) {
      return callback(null, this._ratio);
    }

    return this.termSize((err, dimensions) => {
      if (err) return callback(err);

      this._ratio = {
        tw: dimensions.width / this.screen.width,
        th: dimensions.height / this.screen.height,
      };

      this._needsRatio = false;

      return callback(null, this._ratio);
    });
  }

  renderImageSync(img: string, ratio: PixelRatio): boolean {
    if (OverlayImage.hasW3MDisplay === false) {
      throw new Error('W3M Image Display not available.');
    }

    if (!ratio) {
      throw new Error('No ratio.');
    }

    // clearImage unsets these:
    var _file = this.file;
    var _lastSize = this._lastSize;

    this.clearImageSync();

    this.file = _file;
    this._lastSize = _lastSize;

    var width = (this.width * ratio.tw) | 0,
      height = (this.height * ratio.th) | 0,
      aleft = (this.aleft * ratio.tw) | 0,
      atop = (this.atop * ratio.th) | 0;

    var input =
      '0;1;' +
      aleft +
      ';' +
      atop +
      ';' +
      width +
      ';' +
      height +
      ';;;;;' +
      img +
      '\n4;\n3;\n';

    this._props = {
      aleft: aleft,
      atop: atop,
      width: width,
      height: height,
    };

    try {
      cp.execFileSync(OverlayImage.w3mdisplay, [], {
        env: process.env,
        encoding: 'utf8',
        input: input,
        timeout: 1000,
      });
    } catch (e) {}

    return true;
  }

  clearImageSync(): boolean {
    if (OverlayImage.hasW3MDisplay === false) {
      throw new Error('W3M Image Display not available.');
    }

    if (!this._props) {
      return false;
    }

    var width = this._props.width + 2,
      height = this._props.height + 2,
      aleft = this._props.aleft,
      atop = this._props.atop;

    if (this._drag) {
      aleft -= 10;
      atop -= 10;
      width += 10;
      height += 10;
    }

    var input =
      '6;' + aleft + ';' + atop + ';' + width + ';' + height + '\n4;\n3;\n';

    delete this.file;
    delete this._props;
    delete this._lastSize;

    try {
      cp.execFileSync(OverlayImage.w3mdisplay, [], {
        env: process.env,
        encoding: 'utf8',
        input: input,
        timeout: 1000,
      });
    } catch (e) {}

    return true;
  }

  imageSizeSync(): ImageSize {
    var img = this.file;

    if (OverlayImage.hasW3MDisplay === false) {
      throw new Error('W3M Image Display not available.');
    }

    if (!img) {
      throw new Error('No image.');
    }

    var buf = '';
    var input = '5;' + img + '\n';

    try {
      buf = cp.execFileSync(OverlayImage.w3mdisplay, [], {
        env: process.env,
        encoding: 'utf8',
        input: input,
        timeout: 1000,
      });
    } catch (e) {}

    var size = buf.trim().split(/\s+/);

    return {
      raw: buf.trim(),
      width: +size[0],
      height: +size[1],
    };
  }

  termSizeSync(_?: any, recurse?: number): ImageSize {
    if (OverlayImage.hasW3MDisplay === false) {
      throw new Error('W3M Image Display not available.');
    }

    var buf = '';

    try {
      buf = cp.execFileSync(OverlayImage.w3mdisplay, ['-test'], {
        env: process.env,
        encoding: 'utf8',
        timeout: 1000,
      });
    } catch (e) {}

    if (!buf.trim()) {
      // Bug: w3mimgdisplay will sometimes
      // output nothing. Try again:
      recurse = recurse || 0;
      if (++recurse === 5) {
        throw new Error('Term size not determined.');
      }
      return this.termSizeSync(_, recurse);
    }

    var size = buf.trim().split(/\s+/);

    return {
      raw: buf.trim(),
      width: +size[0],
      height: +size[1],
    };
  }

  getPixelRatioSync(): PixelRatio {
    // XXX We could cache this, but sometimes it's better
    // to recalculate to be pixel perfect.
    if (this._ratio && !this._needsRatio) {
      return this._ratio;
    }
    this._needsRatio = false;

    var dimensions = this.termSizeSync();

    this._ratio = {
      tw: dimensions.width / this.screen.width,
      th: dimensions.height / this.screen.height,
    };

    return this._ratio;
  }

  displayImage(callback?: Function) {
    return this.screen.displayImage(this.file, callback);
  }
}

/**
 * Factory function for backward compatibility
 */
function overlayImage(options?: OverlayImageOptions): OverlayImageInterface {
  return new OverlayImage(options) as OverlayImageInterface;
}

// Attach the class as a property for direct access
overlayImage.OverlayImage = OverlayImage;

/**
 * Expose
 */

export default overlayImage;
