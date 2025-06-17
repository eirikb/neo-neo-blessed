# neo-neo-bblessed

A fork of [neo-neo-blessed](https://github.com/eirikb/neo-neo-blessed) with enhanced bundling support, specifically optimized for [Bun](https://bun.sh) and other modern JavaScript bundlers.

## Features

All the features of neo-neo-blessed, plus:

- **Inlined terminfo data**: Terminal capability files are embedded directly in the code, eliminating runtime file system lookups
- **Bundler-friendly asset resolution**: Uses `require.resolve()` for better compatibility with bundlers
- **Bun-optimized**: Verified to work seamlessly with Bun's bundler for creating single-file executables
- **Cross-platform bundling**: Works reliably on Windows, macOS, and Linux when bundled

## Installation

```bash
npm install neo-neo-bblessed
```

Or with Bun:

```bash
bun add neo-neo-bblessed
```

## Usage

The API is identical to neo-neo-blessed:

```javascript
const blessed = require('neo-neo-bblessed');

// Create a screen object.
const screen = blessed.screen({
  smartCSR: true
});

screen.title = 'my window title';

// Create a box perfectly centered horizontally and vertically.
const box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Hello {bold}world{/bold}!',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    }
  }
});

// Append our box to the screen.
screen.append(box);

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Render the screen.
screen.render();
```

## Bundling with Bun

This fork is specifically optimized for bundling with Bun:

```bash
# Create a single-file executable
bun build ./your-app.js --compile --outfile your-app

# The resulting executable will work on any system without needing Node.js or Bun installed
./your-app
```

## Why this fork?

The original neo-neo-blessed (and blessed) libraries rely on runtime file system access to load terminal capability files (terminfo). This causes issues when bundling applications into single executables, especially with tools like Bun's `--compile` flag.

This fork solves these issues by:

1. Embedding terminfo data directly in the code as base64-encoded strings
2. Providing fallback mechanisms when external files aren't available
3. Using bundler-friendly module resolution patterns

## Compatibility

- Maintains full API compatibility with neo-neo-blessed
- All existing neo-neo-blessed code should work without modifications
- Supports the same Node.js versions as neo-neo-blessed (>= 8.0.0)

## Contributing

Issues and pull requests should be submitted to the [upstream neo-neo-blessed repository](https://github.com/eirikb/neo-neo-blessed) for general blessed functionality.

For bundling-specific issues, please open an issue in this fork's repository.

## License

MIT (same as neo-neo-blessed)