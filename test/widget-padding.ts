import blessed from '../dist/blessed.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
var screen;

screen = blessed.screen({
  dump: __dirname + '/logs/padding.log',
  warnings: true,
});

blessed.box({
  parent: screen,
  border: 'line',
  style: {
    bg: 'red',
  },
  content: 'hello world\nhi',
  align: 'center',
  left: 'center',
  top: 'center',
  width: 22,
  height: 10,
  padding: 2,
});

screen.key('q', function () {
  return screen.destroy();
});

screen.render();
