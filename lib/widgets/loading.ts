/**
 * loading.js - loading element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;
import textFactory from './text.js';
const Text = textFactory.Text;

/**
 * Type definitions
 */

interface LoadingOptions {
  [key: string]: any;
}

interface LoadingIcon {
  content: string;
  setContent(content: string): void;
}

interface LoadingScreen {
  lockKeys: boolean;
  render(): void;
}

interface LoadingInterface extends Box {
  type: string;
  _: {
    icon: LoadingIcon;
    timer?: NodeJS.Timeout;
  };
  screen: LoadingScreen;
  show(): void;
  hide(): void;
  setContent(text: string): void;
  load(text: string): void;
  stop(): void;
}

/**
 * Loading - Modern ES6 Class
 */

class Loading extends Box {
  type = 'loading';
  _: {
    icon: LoadingIcon;
    timer?: NodeJS.Timeout;
  };

  constructor(options?: LoadingOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    this._ = {
      icon: new Text({
        parent: this,
        align: 'center',
        top: 2,
        left: 1,
        right: 1,
        height: 1,
        content: '|',
      }),
    };
  }

  load(text: string): void {
    // XXX Keep above:
    // var parent = this.parent;
    // this.detach();
    // parent.append(this);

    this.show();
    this.setContent(text);

    if (this._.timer) {
      this.stop();
    }

    this.screen.lockKeys = true;

    this._.timer = setInterval(() => {
      if (this._.icon.content === '|') {
        this._.icon.setContent('/');
      } else if (this._.icon.content === '/') {
        this._.icon.setContent('-');
      } else if (this._.icon.content === '-') {
        this._.icon.setContent('\\');
      } else if (this._.icon.content === '\\') {
        this._.icon.setContent('|');
      }
      this.screen.render();
    }, 200);
  }

  stop(): void {
    this.screen.lockKeys = false;
    this.hide();
    if (this._.timer) {
      clearInterval(this._.timer);
      delete this._.timer;
    }
    this.screen.render();
  }
}

/**
 * Factory function for backward compatibility
 */
function loading(options?: LoadingOptions): LoadingInterface {
  return new Loading(options) as LoadingInterface;
}

// Attach the class as a property for direct access
loading.Loading = Loading;

/**
 * Expose
 */

export default loading;
