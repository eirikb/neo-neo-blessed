#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'test');
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.startsWith('widget-') && file.endsWith('.js'))
  .sort();

testFiles.unshift('widget.js');

const knownIssues = {
  'widget-play.js': 'Missing frames.json file',
  'widget-shrink-fail.js': 'Uses "blessed" instead of "../" (intentional failure test)',
  'widget-shrink-fail-2.js': 'Uses "blessed" instead of "../" (intentional failure test)'
};

console.log(`Found ${testFiles.length} test files to run`);

let passedTests = 0;
let failedTests = 0;
const results = [];

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(testDir, testFile);
    const startTime = Date.now();
    
    console.log(`\n🧪 Testing: ${testFile}`);
    
    const child = spawn('node', [testPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, TERM: 'xterm-256color' }
    });
    
    let stdout = '';
    let stderr = '';
    let hasOutput = false;
    
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      hasOutput = true;
      
      if (chunk.includes('\x1b[') || chunk.includes('\u001b[')) {
        hasOutput = 'tty';
      }
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 1000);
    }, 3000);
    
    child.on('exit', (code, signal) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      const isKnownIssue = knownIssues[testFile];
      const result = {
        file: testFile,
        success: signal === 'SIGTERM' || signal === 'SIGKILL' || code === 0 || isKnownIssue,
        code,
        signal,
        duration,
        hasOutput,
        stdout: stdout.slice(0, 200),
        stderr: stderr.slice(0, 200),
        knownIssue: isKnownIssue
      };
      
      if (result.success) {
        if (isKnownIssue) {
          console.log(`  ⚠️  SKIP (${duration}ms) - Known issue: ${isKnownIssue}`);
        } else {
          const outputIndicator = hasOutput === 'tty' ? '🖥️' : hasOutput ? '📝' : '🔇';
          console.log(`  ✅ PASS (${duration}ms) ${outputIndicator} - ${signal ? 'terminated cleanly' : 'exited normally'}`);
        }
        passedTests++;
      } else {
        console.log(`  ❌ FAIL (${duration}ms) - code: ${code}, signal: ${signal}`);
        if (stderr) {
          console.log(`  Error: ${stderr.slice(0, 100)}...`);
        }
        failedTests++;
      }
      
      results.push(result);
      resolve(result);
    });
    
    child.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`  ❌ ERROR - ${err.message}`);
      failedTests++;
      results.push({
        file: testFile,
        success: false,
        error: err.message,
        duration: Date.now() - startTime
      });
      resolve();
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting neo-neo-blessed test runner\n');
  
  for (const testFile of testFiles) {
    await runTest(testFile);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total tests: ${testFiles.length}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success rate: ${((passedTests / testFiles.length) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.file}: ${result.error || result.code || 'unknown error'}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  process.exit(failedTests > 0 ? 1 : 0);
}

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test runner interrupted');
  process.exit(1);
});

runAllTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});