#!/usr/bin/env node

const blessed = require('../index.js');

const argv = process.argv.slice(2);
const cmd = argv.shift();

const tput = blessed.tput({
  terminal: process.env['TERM'],
  termcap: !!process.env['USE_TERMCAP'],
  extended: true,
});

if (cmd && typeof tput[cmd] === 'function') {
  process.stdout.write(tput[cmd].apply(tput, argv));
} else if (cmd && tput[cmd]) {
  process.stdout.write(String(tput[cmd]));
}
