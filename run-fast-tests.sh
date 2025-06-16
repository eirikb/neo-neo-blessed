#!/bin/bash
set -e

echo "Building library..."
npm run build

echo "Building tests..."
npm run build:tests

echo "Setting up entry point for built files..."
mv index.ts index.ts.bak
echo 'module.exports = require("./dist/lib/blessed");' > index.js

echo "Running fast tests..."
node test-runner-fast.js

echo "Restoring original entry point..."
mv index.ts.bak index.ts
rm index.js

echo "Fast test run complete!"