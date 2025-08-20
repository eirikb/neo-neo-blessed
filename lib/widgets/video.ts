/**
 * video.js - video element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as cp from 'child_process';

import Node from './node.js';
import boxFactory from './box.js';
const Box = boxFactory.Box;
import Terminal from './terminal.js';

/**
 * Type definitions
 */

import { VideoOptions, VideoInterface } from '../types/index';

/**
 * Interfaces
 */

interface TerminalOptions {
  parent: any;
  left: number;
  top: number;
  width: number;
  height: number;
  shell: string;
  args: string[];
  start?: number;
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

/**
 * Video - Modern ES6 Class
 */

class Video extends Box {
  type = 'video';
  now: number = 0;
  start: number = 0;
  tty?: VideoTerminal;

  constructor(options?: VideoOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    super(options);

    this._initializeVideo(options);
  }

  private _initializeVideo(options: VideoOptions): void {
    let shell: string;
    let args: string[];

    if (this.exists('mplayer')) {
      shell = 'mplayer';
      args = ['-vo', 'caca', '-quiet', options.file || ''];
    } else if (this.exists('mpv')) {
      shell = 'mpv';
      args = ['--vo', 'caca', '--really-quiet', options.file || ''];
    } else {
      this.parseTags = true;
      this.setContent(
        '{red-fg}{bold}Error:{/bold}' +
          ' mplayer or mpv not installed.{/red-fg}'
      );
      return;
    }

    // Calculate dimensions and ensure they're valid
    let termWidth = this.width - this.iwidth;
    let termHeight = this.height - this.iheight;

    // Ensure minimum valid dimensions
    if (isNaN(termWidth) || termWidth <= 0) termWidth = 80;
    if (isNaN(termHeight) || termHeight <= 0) termHeight = 24;

    const opts: TerminalOptions = {
      parent: this,
      left: 0,
      top: 0,
      width: termWidth,
      height: termHeight,
      shell: shell,
      args: args.slice(),
    };

    this.now = (Date.now() / 1000) | 0;
    this.start = options.start || 0;
    if (this.start) {
      if (shell === 'mplayer') {
        opts.args.unshift('-ss', this.start + '');
      } else if (shell === 'mpv') {
        opts.args.unshift('--start', this.start + '');
      }
    }

    const DISPLAY = process.env.DISPLAY;
    delete process.env.DISPLAY;
    this.tty = new Terminal(opts);
    process.env.DISPLAY = DISPLAY;

    this._setupEventHandlers(shell, args);
  }

  private _setupEventHandlers(shell: string, args: string[]): void {
    this.on('click', () => {
      if (this.tty && this.tty.pty) {
        this.tty.pty.write('p');
      }
    });

    // mplayer/mpv cannot resize itself in the terminal, so we have
    // to restart it at the correct start time.
    this.on('resize', () => {
      if (this.tty) {
        this.tty.destroy();
      }

      // Calculate dimensions and ensure they're valid
      let termWidth = this.width - this.iwidth;
      let termHeight = this.height - this.iheight;

      // Ensure minimum valid dimensions
      if (isNaN(termWidth) || termWidth <= 0) termWidth = 80;
      if (isNaN(termHeight) || termHeight <= 0) termHeight = 24;

      const opts: TerminalOptions = {
        parent: this,
        left: 0,
        top: 0,
        width: termWidth,
        height: termHeight,
        shell: shell,
        args: args.slice(),
      };

      const watched = ((Date.now() / 1000) | 0) - this.now;
      this.now = (Date.now() / 1000) | 0;
      this.start += watched;
      if (shell === 'mplayer') {
        opts.args.unshift('-ss', this.start + '');
      } else if (shell === 'mpv') {
        opts.args.unshift('--start', this.start + '');
      }

      const DISPLAY = process.env.DISPLAY;
      delete process.env.DISPLAY;
      this.tty = new Terminal(opts);
      process.env.DISPLAY = DISPLAY;
      (this.screen as VideoScreen).render();
    });
  }

  exists(program: string): boolean {
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
  }

  // Video control methods for interface compatibility
  play(): void {
    if (this.tty && this.tty.pty) {
      this.tty.pty.write('p');
    }
  }

  pause(): void {
    if (this.tty && this.tty.pty) {
      this.tty.pty.write('p');
    }
  }

  stop(): void {
    if (this.tty) {
      this.tty.destroy();
    }
  }
}

/**
 * Factory function for backward compatibility
 */
function video(options?: VideoOptions): VideoInterface {
  return new Video(options) as VideoInterface;
}

// Attach the class as a property for direct access
video.Video = Video;

/**
 * Expose
 */

export default video;
