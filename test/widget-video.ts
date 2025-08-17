import blessed from '../dist/blessed.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var screen = blessed.screen({
  tput: true,
  smartCSR: true,
  dump: __dirname + '/logs/video.log',
  warnings: true,
});

var video = blessed.video({
  parent: screen,
  left: 1,
  top: 1,
  width: '90%',
  height: '90%',
  border: 'line',
  file: process.argv[2],
});

video.focus();

screen.render();

screen.key(['q', 'C-q', 'C-c'], function () {
  screen.destroy();
});
