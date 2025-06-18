#!/bin/bash
set -e

echo "Building library..."
npm run build

echo "Building tests..."
npm run build:tests

echo "Setting up entry point for built files..."
mv index.js index.js.bak
echo 'module.exports = require("./dist/blessed");' > index.js

echo "Running fast tests..."
npx tsx test-runner-fast.ts

echo "Restoring original entry point..."
mv index.js.bak index.js

echo "Fast test run complete!"