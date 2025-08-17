import blessed from '../dist/blessed.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
var screen;

screen = blessed.screen({
  dump: __dirname + '/logs/textarea.log',
  fullUnicode: true,
  warnings: true,
});

var box = blessed.textarea({
  parent: screen,
  // Possibly support:
  // align: 'center',
  style: {
    bg: 'blue',
  },
  height: 'half',
  width: 'half',
  top: 'center',
  left: 'center',
  tags: true,
});

screen.render();

screen.key('q', function () {
  screen.destroy();
});

screen.key('i', function () {
  box.readInput(function () {});
});

screen.key('e', function () {
  box.readEditor(function () {});
});
