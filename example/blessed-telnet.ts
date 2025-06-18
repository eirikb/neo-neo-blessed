#!/usr/bin/env node

/**
 * blessed-telnet.js
 * https://github.com/chjj/blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey (MIT License)
 * A blessed telnet server.
 * See: https://github.com/TooTallNate/node-telnet
 */

process.title = 'blessed-telnet';

import * as fs from 'fs';
import * as path from 'path';
import * as blessed from '../lib/blessed';

// Note: telnet2 would need to be installed separately
const telnet = require('telnet2');

const server = telnet({ tty: true }, function (client: any) {
  client.on('debug', function (msg: string) {
    console.error(msg);
  });

  client.on('term', function (terminal: string) {
    screen.terminal = terminal;
    screen.render();
  });

  client.on('size', function (width: number, height: number) {
    client.columns = width;
    client.rows = height;
    client.emit('resize');
  });

  const screen = blessed.screen({
    smartCSR: true,
    input: client,
    output: client,
    terminal: 'xterm-256color',
    fullUnicode: true,
  });

  client.on('close', function () {
    if (!screen.destroyed) {
      screen.destroy();
    }
  });

  screen.on('destroy', function () {
    if (client.writable) {
      client.destroy();
    }
  });

  if (test === 'widget-simple') {
    return simpleTest(screen);
  }

  loadTest(screen, test);
});

function simpleTest(screen: blessed.Widgets.Screen): void {
  (screen as any).data.main = blessed.box({
    parent: screen,
    width: '80%',
    height: '90%',
    border: 'line',
    content: 'Welcome to my server. Here is your own private session.',
    style: {
      bg: 'red',
    },
  });

  screen.key('i', function () {
    (screen as any).data.main.style.bg = 'blue';
    screen.render();
  });

  screen.key(['C-c', 'q'], function (ch, key) {
    screen.destroy();
  });

  screen.render();
}

const test =
  process.argv[2] || path.resolve(__dirname, '../test/widget-shadow.js');
if (~test.indexOf('widget-png.js')) process.argv.length = 2;
const testPath = path.resolve(process.cwd(), test);

function loadTest(screen: blessed.Widgets.Screen, name: string): void {
  const Screen = blessed.screen;
  (blessed as any).screen = function () {
    return screen;
  };
  const modulePath = require.resolve(name);
  delete require.cache[modulePath];
  require(name);
  (blessed as any).screen = Screen;
}

server.listen(2300);
console.log('Listening on 2300...');
