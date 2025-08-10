/**
 * Test to reproduce the replaceChildren crash in terminal widget
 * This test demonstrates that xterm.js's DomRenderer can now call
 * replaceChildren on the mock DOM element without crashing
 */

var blessed = require('../');
var path = require('path');

console.log('🧪 Testing terminal widget replaceChildren crash fix...');

var screen = blessed.screen({
  dump: path.join(__dirname, '/logs/terminal-replacechildren.log'),
  warnings: true,
  fullUnicode: true,
});

// Create a terminal similar to the usage in anton app
var terminal = blessed.terminal({
  parent: screen,
  top: 0,
  left: 0,
  width: 40,
  height: 20,
  border: 'line',
  label: ' Test Terminal ',
  shell: '/bin/bash',
  args: ['-c', 'sleep 1000000'],
  fullUnicode: true,
});

// Write some data to trigger rendering
terminal.write('Test output\r\n');
terminal.write('This should trigger xterm rendering\r\n');

screen.render();

// Give it a moment to initialize and render
setTimeout(function () {
  try {
    // Trigger the problematic cleanup path
    // This simulates what happens when stream.on("end") is called
    terminal.destroy();
    screen.destroy();

    // If we get here without error, the bug is fixed
    console.log(
      '✅ SUCCESS: Terminal can be destroyed without replaceChildren crash!'
    );
    process.exit(0);
  } catch (err) {
    if (
      err.message &&
      err.message.includes('replaceChildren is not a function')
    ) {
      console.error('❌ FAIL: replaceChildren is still missing:', err.message);
      process.exit(1);
    } else {
      console.error('❌ UNEXPECTED ERROR:', err.message);
      console.error(err.stack);
      process.exit(2);
    }
  }
}, 500);
