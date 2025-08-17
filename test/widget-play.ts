import blessed from '../dist/blessed.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var screen = blessed.screen({
  dump: __dirname + '/logs/play.log',
  smartCSR: true,
  warnings: true,
});

// var frames = require(__dirname + '/frames.json'); // File doesn't exist
var frames = [];

var timer = setInterval(function () {
  if (!frames.length) {
    clearInterval(timer);
    return screen.destroy();
  }
  process.stdout.write(frames.shift());
}, 100);
