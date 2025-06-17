# TypeScript Migration Guide

This guide helps you migrate your existing neo-neo-blessed projects to take advantage of the new TypeScript support.

## What's New

- ✅ **Full TypeScript Support**: All source code is now properly typed
- ✅ **Comprehensive Type Definitions**: Complete interfaces for all widgets and APIs
- ✅ **Better IntelliSense**: Improved autocomplete and error detection in IDEs
- ✅ **Type Safety**: Catch errors at compile time instead of runtime
- ✅ **100% Backward Compatible**: All existing JavaScript code continues to work

## Installation

The package works the same way as before:

```bash
npm install neo-neo-blessed
```

For TypeScript projects, you may also want to install type definitions for Node.js:

```bash
npm install --save-dev @types/node
```

## Basic Migration Steps

### 1. Update Your Imports (Optional)

Your existing CommonJS imports continue to work:

```javascript
// This still works
const blessed = require('neo-neo-blessed');
```

But you can now use ES6 imports for better TypeScript support:

```typescript
// New, recommended approach
import blessed from 'neo-neo-blessed';

// Or for specific widgets
import { screen, box, list } from 'neo-neo-blessed';
```

### 2. Add Type Annotations (Optional)

You can gradually add type annotations to get better IDE support:

```typescript
// Before (JavaScript)
const screen = blessed.screen({
  smartCSR: true,
});

// After (TypeScript with explicit typing)
const screen: blessed.ScreenInterface = blessed.screen({
  smartCSR: true,
});

// Or let TypeScript infer (recommended)
const screen = blessed.screen({
  smartCSR: true,
});
```

### 3. Configuration Objects

Take advantage of typed configuration options:

```typescript
// TypeScript will catch typos and invalid options
const boxOptions: blessed.BoxOptions = {
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Hello World!',
  border: {
    type: 'line', // TypeScript knows valid border types
  },
  style: {
    fg: 'white',
    bg: 'blue',
  },
};

const box = blessed.box(boxOptions);
```

## Common Migration Patterns

### Event Handlers

```typescript
// Before (JavaScript)
box.on('click', function (data) {
  console.log('Clicked at', data.x, data.y);
});

// After (TypeScript with proper typing)
box.on('click', (data: blessed.MouseData) => {
  console.log('Clicked at', data.x, data.y);
});

// Or let TypeScript infer the type (recommended)
box.on('click', data => {
  console.log('Clicked at', data.x, data.y); // data is automatically typed
});
```

### Widget Creation

```typescript
// Before (JavaScript)
const list = blessed.list({
  items: ['item1', 'item2'],
  selected: 0,
});

// After (TypeScript)
const list = blessed.list({
  items: ['item1', 'item2'],
  selected: 0,
  style: {
    selected: {
      bg: 'blue', // TypeScript knows valid style properties
    },
  },
});
```

### Form Handling

```typescript
// Before (JavaScript)
form.on('submit', function (data) {
  console.log('Form data:', data);
});

// After (TypeScript)
form.on('submit', (data: { [key: string]: any }) => {
  console.log('Form data:', data);

  // TypeScript helps with property access
  if (data.username && data.password) {
    // Handle login
  }
});
```

## Advanced TypeScript Features

### Custom Widget Types

```typescript
// Define custom interfaces for your specific use cases
interface MyCustomBoxOptions extends blessed.BoxOptions {
  customTitle?: string;
  customColor?: string;
}

function createMyBox(options: MyCustomBoxOptions): blessed.BoxInterface {
  return blessed.box({
    ...options,
    content: options.customTitle || 'Default Title',
    style: {
      ...options.style,
      fg: options.customColor || 'white',
    },
  });
}
```

### Generic Event Handling

```typescript
// Type-safe event emission
interface AppEvents {
  'user-login': { username: string; timestamp: Date };
  'user-logout': { username: string };
  'data-updated': { count: number };
}

class AppEventEmitter extends blessed.NodeInterface {
  emit<K extends keyof AppEvents>(event: K, data: AppEvents[K]): boolean {
    return super.emit(event, data);
  }

  on<K extends keyof AppEvents>(
    event: K,
    listener: (data: AppEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }
}
```

### Configuration Management

```typescript
// Type-safe configuration
interface AppTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface AppConfig {
  theme: AppTheme;
  screen: blessed.ScreenOptions;
  features: {
    enableMouse: boolean;
    enableKeyboard: boolean;
    enableLogging: boolean;
  };
}

const defaultConfig: AppConfig = {
  theme: {
    primary: 'blue',
    secondary: 'green',
    accent: 'yellow',
    background: 'black',
  },
  screen: {
    smartCSR: true,
    fullUnicode: true,
  },
  features: {
    enableMouse: true,
    enableKeyboard: true,
    enableLogging: false,
  },
};

function createApp(config: Partial<AppConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const screen = blessed.screen(finalConfig.screen);

  // Use theme throughout the app
  const mainBox = blessed.box({
    parent: screen,
    style: {
      bg: finalConfig.theme.background,
      fg: finalConfig.theme.primary,
    },
  });

  return { screen, mainBox, config: finalConfig };
}
```

## Troubleshooting

### Type Errors

If you encounter type errors after migration:

1. **Check your tsconfig.json**: Ensure you have appropriate compiler options
2. **Update dependencies**: Make sure you're using compatible versions
3. **Use type assertions carefully**: Only when you know the types better than TypeScript

```typescript
// Use type assertions sparingly
const specificWidget = someWidget as blessed.ListInterface;

// Better: Use type guards
function isList(
  widget: blessed.ElementInterface
): widget is blessed.ListInterface {
  return widget.type === 'list';
}

if (isList(myWidget)) {
  // TypeScript now knows myWidget is a ListInterface
  myWidget.select(0);
}
```

### Missing Type Definitions

If you find missing type definitions for specific APIs:

1. **Check the documentation**: The API might have been renamed or moved
2. **Use `any` temporarily**: Add a TODO comment to fix later
3. **Contribute back**: Consider submitting a PR with the missing types

```typescript
// Temporary workaround for missing types
const customMethod = (widget as any).someUndocumentedMethod;
// TODO: Add proper type definition for someUndocumentedMethod
```

## Benefits After Migration

Once you've migrated to TypeScript, you'll enjoy:

- **Better IDE Support**: Autocomplete, go-to-definition, and refactoring tools
- **Fewer Runtime Errors**: Catch typos and type mismatches at compile time
- **Self-Documenting Code**: Type annotations serve as inline documentation
- **Easier Refactoring**: Safe renaming and restructuring with IDE support
- **Team Collaboration**: Clearer interfaces make code easier to understand

## Getting Help

If you need help with the migration:

1. Check the [TypeScript Examples](./typescript-examples.md)
2. Review the type definitions in `index.d.ts`
3. Open an issue on GitHub with your specific migration question

The TypeScript support is designed to be gradual - you can adopt it incrementally and gain benefits immediately.
