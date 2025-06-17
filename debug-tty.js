const { spawn } = require('child_process');

const child = spawn('node', ['test/widget-autopad.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, TERM: 'xterm-256color' }
});

child.stdout.on('data', (data) => {
  const chunk = data.toString();
  console.log('GOT CHUNK:', JSON.stringify(chunk.slice(0, 50)));
  console.log('HAS ESC:', chunk.includes('\x1b['));
  child.kill('SIGTERM');
});

setTimeout(() => {
  child.kill('SIGKILL');
}, 1000);