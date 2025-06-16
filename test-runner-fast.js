#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`Testing ${testFile}...`);
    
    const child = spawn('node', [testFile], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    let hasOutput = false;
    let initialTtyTimeout;
    let cleanupTimeout;

    const cleanup = (result) => {
      if (initialTtyTimeout) clearTimeout(initialTtyTimeout);
      if (cleanupTimeout) clearTimeout(cleanupTimeout);
      resolve(result);
    };

    child.stdout.on('data', (data) => {
      const str = data.toString();
      if (str.includes('\x1b[') || str.includes('\u001b[')) {
        hasOutput = true;
        console.log(`✓ ${testFile} - TTY output detected`);
        child.kill('SIGTERM');
        cleanup(true);
      }
    });

    child.on('exit', (code) => {
      if (!hasOutput) {
        console.log(`✗ ${testFile} - terminated cleanly (no TTY output)`);
        cleanup(false);
      }
    });

    initialTtyTimeout = setTimeout(() => {
      child.kill('SIGTERM');
      cleanupTimeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 500);
    }, 1000);
  });
}

async function main() {
  const testDir = path.join(__dirname, 'test-dist');
  const testFiles = fs.readdirSync(testDir)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(testDir, file));

  console.log(`Running ${testFiles.length} tests using built JS files...\n`);

  let passed = 0;
  let total = testFiles.length;

  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    if (result) passed++;
  }

  console.log(`\n${passed}/${total} tests passed`);
  process.exit(passed === total ? 0 : 1);
}

main().catch(console.error);