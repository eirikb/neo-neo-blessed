import blessed from '../dist/blessed.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
var screen;

screen = blessed.screen({
  dump: __dirname + '/logs/valign.log',
  smartCSR: true,
  autoPadding: false,
  warnings: true,
});

var box = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: 5,
  align: 'center',
  valign: 'middle',
  // valign: 'bottom',
  content: 'Foobar.',
  border: 'line',
});

screen.key('q', function () {
  return screen.destroy();
});

screen.render();
