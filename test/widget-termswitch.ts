import blessed from '../dist/blessed.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
var screen;

screen = blessed.screen({
  dump: __dirname + '/logs/termswitch.log',
  smartCSR: true,
  warnings: true,
});

var lorem = fs.readFileSync(__dirname + '/git.diff', 'utf8');

var btext = blessed.box({
  parent: screen,
  left: 'center',
  top: 'center',
  width: '80%',
  height: '80%',
  style: {
    bg: 'green',
  },
  border: 'line',
  content: 'CSR should still work.',
});

var text = blessed.scrollabletext({
  parent: screen,
  content: lorem,
  border: 'line',
  left: 'center',
  top: 'center',
  draggable: true,
  width: '50%',
  height: '50%',
  mouse: true,
  keys: true,
  vi: true,
});

text.focus();

screen.key('q', function () {
  return screen.destroy();
});

screen.render();

setTimeout(function () {
  // screen.setTerminal('vt100');
  screen.terminal = 'vt100';
  screen.render();
  text.setContent(screen.program._terminal);
  screen.render();
}, 1000);
