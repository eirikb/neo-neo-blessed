/**
 * video.js - video element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var cp = require('child_process');

var Node = require('./node');
var Box = require('./box');
var Terminal = require('./terminal');

/**
 * Interfaces
 */

interface VideoOptions {
  file?: string;
  start?: number;
  [key: string]: any;
}

interface TerminalOptions {
  parent: any;
  left: number;
  top: number;
  width: number;
  height: number;
  shell: string;
  args: string[];
}

interface VideoTerminal {
  pty: {
    write(data: string): void;
  };
  destroy(): void;
}

interface VideoScreen {
  render(): void;
}

interface VideoInterface extends Box {
  type: string;
  now: number;
  start: number;
  tty: VideoTerminal;
  screen: VideoScreen;
  width: number;
  height: number;
  iwidth: number;
  iheight: number;
  parseTags?: boolean;

  // Methods
  exists(program: string): boolean;
  setContent(content: string): void;
  on(event: string, listener: Function): void;
}

/**
 * Video
 */

function Video(this: VideoInterface, options?: VideoOptions) {
  var self = this,
    shell: string,
    args: string[];

  if (!(this instanceof Node)) {
    return new Video(options);
  }

  options = options || {};

  Box.call(this, options);

  if (this.exists('mplayer')) {
    shell = 'mplayer';
    args = ['-vo', 'caca', '-quiet', options.file];
  } else if (this.exists('mpv')) {
    shell = 'mpv';
    args = ['--vo', 'caca', '--really-quiet', options.file];
  } else {
    this.parseTags = true;
    this.setContent(
      '{red-fg}{bold}Error:{/bold}' + ' mplayer or mpv not installed.{/red-fg}'
    );
    return this;
  }

  // Calculate dimensions and ensure they're valid
  var termWidth = this.width - this.iwidth;
  var termHeight = this.height - this.iheight;

  // Ensure minimum valid dimensions
  if (isNaN(termWidth) || termWidth <= 0) termWidth = 80;
  if (isNaN(termHeight) || termHeight <= 0) termHeight = 24;

  var opts: TerminalOptions = {
    parent: this,
    left: 0,
    top: 0,
    width: termWidth,
    height: termHeight,
    shell: shell,
    args: args.slice(),
  };

  this.now = (Date.now() / 1000) | 0;
  this.start = opts.start || 0;
  if (this.start) {
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', this.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', this.start + '');
    }
  }

  var DISPLAY = process.env.DISPLAY;
  delete process.env.DISPLAY;
  this.tty = new Terminal(opts);
  process.env.DISPLAY = DISPLAY;

  this.on('click', function () {
    self.tty.pty.write('p');
  });

  // mplayer/mpv cannot resize itself in the terminal, so we have
  // to restart it at the correct start time.
  this.on('resize', function () {
    self.tty.destroy();

    // Calculate dimensions and ensure they're valid
    var termWidth = self.width - self.iwidth;
    var termHeight = self.height - self.iheight;

    // Ensure minimum valid dimensions
    if (isNaN(termWidth) || termWidth <= 0) termWidth = 80;
    if (isNaN(termHeight) || termHeight <= 0) termHeight = 24;

    var opts: TerminalOptions = {
      parent: self,
      left: 0,
      top: 0,
      width: termWidth,
      height: termHeight,
      shell: shell,
      args: args.slice(),
    };

    var watched = ((Date.now() / 1000) | 0) - self.now;
    self.now = (Date.now() / 1000) | 0;
    self.start += watched;
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', self.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', self.start + '');
    }

    var DISPLAY = process.env.DISPLAY;
    delete process.env.DISPLAY;
    self.tty = new Terminal(opts);
    process.env.DISPLAY = DISPLAY;
    self.screen.render();
  });
}

Video.prototype.__proto__ = Box.prototype;

Video.prototype.type = 'video';

Video.prototype.exists = function (
  this: VideoInterface,
  program: string
): boolean {
  try {
    return !!+cp
      .execSync(
        'type ' + program + ' > /dev/null 2> /dev/null' + ' && echo 1',
        { encoding: 'utf8' }
      )
      .trim();
  } catch (e) {
    return false;
  }
};

/**
 * Expose
 */

module.exports = Video;
