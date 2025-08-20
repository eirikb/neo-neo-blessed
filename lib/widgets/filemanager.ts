/**
 * filemanager.js - file manager element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import * as path from 'path';
import * as fs from 'fs';

import * as helpers from '../helpers.js';

import Node from './node.js';
import listFactory from './list.js';
const List = listFactory.List;

/**
 * Interfaces
 */

interface FileManagerOptions {
  cwd?: string;
  label?: string;
  parseTags?: boolean;
  [key: string]: any;
}

interface FileItem {
  name: string;
  text: string;
  dir: boolean;
}

interface FileManagerLabel {
  setContent(content: string): void;
}

interface FileManagerScreen {
  focused: any;
  render(): void;
  saveFocus(): void;
  restoreFocus(): void;
}

interface FileManagerInterface extends List {
  type: string;
  cwd: string;
  file: string;
  value: string;
  _label: FileManagerLabel;
  screen: FileManagerScreen;
  options: FileManagerOptions;
  hidden: boolean;

  // Methods
  refresh(cwd?: string | Function, callback?: Function): any;
  pick(cwd?: string | Function, callback?: Function): void;
  reset(cwd?: string | Function, callback?: Function): void;
  emit(event: string, ...args: any[]): any;
  on(event: string, listener: Function): void;
  removeListener(event: string, listener: Function): void;
  setItems(items: string[]): void;
  select(index: number): void;
  hide(): void;
  show(): void;
  focus(): void;
}

/**
 * FileManager - Modern ES6 Class
 */

class FileManager extends List {
  type = 'file-manager';
  cwd: string;
  file: string;
  value: string;

  constructor(options?: FileManagerOptions) {
    // Handle malformed options gracefully
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    }

    // Force filemanager-specific options
    options.parseTags = true;
    // options.label = ' {blue-fg}%path{/blue-fg} ';

    super(options);

    this.cwd = options.cwd || process.cwd();
    this.file = this.cwd;
    this.value = this.cwd;

    if (options.label && ~options.label.indexOf('%path')) {
      this._label.setContent(options.label.replace('%path', this.cwd));
    }

    this.on('select', (item: any) => {
      const value = item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, '');
      const file = path.resolve(this.cwd, value);

      return fs.stat(
        file,
        (err: NodeJS.ErrnoException | null, stat?: fs.Stats) => {
          if (err) {
            return this.emit('error', err, file);
          }
          this.file = file;
          this.value = file;
          if (stat!.isDirectory()) {
            this.emit('cd', file, this.cwd);
            this.cwd = file;
            if (options!.label && ~options!.label.indexOf('%path')) {
              this._label.setContent(options!.label.replace('%path', file));
            }
            this.refresh();
          } else {
            this.emit('file', file);
          }
        }
      );
    });
  }

  refresh(cwd?: string | Function, callback?: Function): any {
    if (!callback) {
      callback = cwd;
      cwd = null;
    }

    if (cwd) this.cwd = cwd as string;
    else cwd = this.cwd;

    return fs.readdir(
      cwd as string,
      (err: NodeJS.ErrnoException | null, list?: string[]) => {
        if (err && err.code === 'ENOENT') {
          this.cwd = cwd !== process.env.HOME ? process.env.HOME! : '/';
          return this.refresh(callback);
        }

        if (err) {
          if (callback) return callback(err);
          return this.emit('error', err, cwd);
        }

        let dirs: FileItem[] = [];
        let files: FileItem[] = [];

        list!.unshift('..');

        list!.forEach((name: string) => {
          const f = path.resolve(cwd as string, name);
          let stat: fs.Stats | undefined;

          try {
            stat = fs.lstatSync(f);
          } catch (e) {}

          if ((stat && stat.isDirectory()) || name === '..') {
            dirs.push({
              name: name,
              text: '{light-blue-fg}' + name + '{/light-blue-fg}/',
              dir: true,
            });
          } else if (stat && stat.isSymbolicLink()) {
            files.push({
              name: name,
              text: '{light-cyan-fg}' + name + '{/light-cyan-fg}@',
              dir: false,
            });
          } else {
            files.push({
              name: name,
              text: name,
              dir: false,
            });
          }
        });

        dirs = helpers.asort(dirs);
        files = helpers.asort(files);

        list = dirs.concat(files).map((data: FileItem) => {
          return data.text;
        });

        this.setItems(list);
        this.select(0);
        this.screen.render();

        this.emit('refresh');

        if (callback) callback();
      }
    );
  }

  pick(cwd?: string | Function, callback?: Function): void {
    if (!callback) {
      callback = cwd;
      cwd = null;
    }

    const focused = this.screen.focused === this;
    const hidden = this.hidden;
    let onfile: Function;
    let oncancel: Function;

    const resume = () => {
      this.removeListener('file', onfile);
      this.removeListener('cancel', oncancel);
      if (hidden) {
        this.hide();
      }
      if (!focused) {
        this.screen.restoreFocus();
      }
      this.screen.render();
    };

    this.on(
      'file',
      (onfile = (file: string) => {
        resume();
        return callback!(null, file);
      })
    );

    this.on(
      'cancel',
      (oncancel = () => {
        resume();
        return callback!();
      })
    );

    this.refresh(cwd as string, (err?: NodeJS.ErrnoException) => {
      if (err) return callback!(err);

      if (hidden) {
        this.show();
      }

      if (!focused) {
        this.screen.saveFocus();
        this.focus();
      }

      this.screen.render();
    });
  }

  reset(cwd?: string | Function, callback?: Function): void {
    if (!callback) {
      callback = cwd;
      cwd = null;
    }
    this.cwd = (cwd as string) || this.options.cwd;
    this.refresh(callback);
  }
}

/**
 * Factory function for backward compatibility
 */
function fileManager(options?: FileManagerOptions): FileManagerInterface {
  return new FileManager(options) as FileManagerInterface;
}

// Attach the class as a property for direct access
fileManager.FileManager = FileManager;

/**
 * Expose
 */

export default fileManager;
