/**
 * loading.js - loading element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

const Node = require('./node');
const Box = require('./box');
const Text = require('./text');

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
}

/**
 * Loading
 */

function Loading(this: LoadingInterface, options?: LoadingOptions) {
  if (!(this instanceof Node)) {
    return new (Loading as any)(options);
  }

  options = options || {};

  Box.call(this, options);

  this._.icon = new Text({
    parent: this,
    align: 'center',
    top: 2,
    left: 1,
    right: 1,
    height: 1,
    content: '|',
  });
}

Loading.prototype.__proto__ = Box.prototype;

Loading.prototype.type = 'loading';

Loading.prototype.load = function (this: LoadingInterface, text: string): void {
  const self = this;

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

  this._.timer = setInterval(function () {
    if (self._.icon.content === '|') {
      self._.icon.setContent('/');
    } else if (self._.icon.content === '/') {
      self._.icon.setContent('-');
    } else if (self._.icon.content === '-') {
      self._.icon.setContent('\\');
    } else if (self._.icon.content === '\\') {
      self._.icon.setContent('|');
    }
    self.screen.render();
  }, 200);
};

Loading.prototype.stop = function (this: LoadingInterface): void {
  this.screen.lockKeys = false;
  this.hide();
  if (this._.timer) {
    clearInterval(this._.timer);
    delete this._.timer;
  }
  this.screen.render();
};

/**
 * Expose
 */

module.exports = Loading;
