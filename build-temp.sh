#!/bin/bash
# Temporary build script until TypeScript compiler is fixed

echo "Building neo-neo-blessed..."

# Clean dist directory
rm -rf dist
mkdir -p dist/lib/widgets

# Copy TypeScript files as JavaScript (they're still JS syntax)
find lib -name "*.ts" | while read file; do 
  cp "$file" "dist/${file%.ts}.js"
done

# Copy vendor and usr directories
cp -r vendor dist/
cp -r usr dist/

echo "Build complete!"