# TypeScript Usage Examples

This document provides examples of how to use neo-neo-blessed with TypeScript.

## Basic Screen and Box

```typescript
import blessed from 'neo-neo-blessed';

// Create a screen instance
const screen = blessed.screen({
  smartCSR: true,
  title: 'My Application',
});

// Create a centered box
const box = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Hello World!',
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0',
    },
    hover: {
      bg: 'green',
    },
  },
});

// Quit on Escape, q, or Control-C
screen.key(['escape', 'q', 'C-c'], () => {
  process.exit(0);
});

// Focus our element
box.focus();

// Render the screen
screen.render();
```

## Interactive List

```typescript
import blessed from 'neo-neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
});

const list = blessed.list({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  items: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'],
  keys: true,
  vi: true,
  mouse: true,
  border: 'line',
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'cyan',
    },
    style: {
      inverse: true,
    },
  },
  style: {
    item: {
      hover: {
        bg: 'blue',
      },
    },
    selected: {
      bg: 'blue',
      bold: true,
    },
  },
});

// Handle selection
list.on('select', item => {
  const msg = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 'shrink',
    width: 'half',
    align: 'center',
    valign: 'middle',
    border: 'line',
  });

  msg.display(`You selected: ${item.content}`, 3, () => {
    list.focus();
    screen.render();
  });
});

screen.key(['escape', 'q', 'C-c'], () => {
  process.exit(0);
});

list.focus();
screen.render();
```

## Form with Input Fields

```typescript
import blessed from 'neo-neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
});

const form = blessed.form({
  parent: screen,
  top: 'center',
  left: 'center',
  width: 30,
  height: 12,
  bg: 'green',
  keys: true,
  vi: true,
});

const nameInput = blessed.textbox({
  parent: form,
  name: 'name',
  top: 1,
  height: 3,
  inputOnFocus: true,
  content: 'Name:',
  border: {
    type: 'line',
  },
  focus: {
    fg: 'blue',
  },
});

const emailInput = blessed.textbox({
  parent: form,
  name: 'email',
  top: 5,
  height: 3,
  inputOnFocus: true,
  content: 'Email:',
  border: {
    type: 'line',
  },
  focus: {
    fg: 'blue',
  },
});

const submit = blessed.button({
  parent: form,
  name: 'submit',
  content: 'Submit',
  top: 9,
  shrink: true,
  padding: {
    left: 1,
    right: 1,
  },
  style: {
    bg: 'blue',
    focus: {
      bg: 'red',
    },
  },
});

// Handle form submission
submit.on('press', () => {
  form.submit();
});

form.on('submit', (data: { [key: string]: any }) => {
  const msg = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 'shrink',
    width: 'half',
    align: 'center',
    valign: 'middle',
    border: 'line',
  });

  msg.display(`Form Data:\nName: ${data.name}\nEmail: ${data.email}`, 0);
});

screen.key(['escape', 'q', 'C-c'], () => {
  process.exit(0);
});

nameInput.focus();
screen.render();
```

## Terminal Widget

```typescript
import blessed from 'neo-neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
});

const terminal = blessed.terminal({
  parent: screen,
  cursor: 'line',
  cursorBlink: true,
  screenKeys: false,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: 'line',
});

terminal.on('title', (title: string) => {
  screen.title = title;
  screen.render();
});

screen.key(['C-c'], () => {
  process.exit(0);
});

terminal.focus();
screen.render();
```

## Type-Safe Event Handling

```typescript
import blessed from 'neo-neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
});

const box = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Click me!',
  clickable: true,
  mouse: true,
  border: 'line',
});

// Type-safe event handlers
box.on('click', data => {
  box.setContent(`Clicked at ${data.x}, ${data.y}`);
  screen.render();
});

box.on('keypress', (ch: string, key: any) => {
  if (key.name === 'enter') {
    box.setContent('Enter pressed!');
    screen.render();
  }
});

screen.key(['escape', 'q', 'C-c'], () => {
  process.exit(0);
});

box.focus();
screen.render();
```

## Custom Widget Interfaces

```typescript
import blessed from 'neo-neo-blessed';

// You can extend the provided interfaces for custom widgets
interface CustomBoxOptions extends blessed.BoxOptions {
  customProperty?: string;
}

interface CustomBox extends blessed.BoxInterface {
  customMethod(): void;
}

function createCustomBox(options: CustomBoxOptions): CustomBox {
  const box = blessed.box(options) as CustomBox;

  box.customMethod = function () {
    this.setContent(`Custom property: ${options.customProperty}`);
  };

  return box;
}

const screen = blessed.screen({
  smartCSR: true,
});

const customBox = createCustomBox({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  border: 'line',
  customProperty: 'Hello TypeScript!',
});

customBox.customMethod();

screen.key(['escape', 'q', 'C-c'], () => {
  process.exit(0);
});

screen.render();
```

## Configuration with Type Safety

```typescript
import blessed from 'neo-neo-blessed';

// Define your configuration with types
interface AppConfig {
  screen: blessed.ScreenOptions;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const config: AppConfig = {
  screen: {
    smartCSR: true,
    title: 'TypeScript Blessed App',
    fullUnicode: true,
    dockBorders: true,
  },
  theme: {
    primary: 'blue',
    secondary: 'green',
    accent: 'yellow',
  },
};

const screen = blessed.screen(config.screen);

const mainBox = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '80%',
  height: '80%',
  border: 'line',
  style: {
    fg: 'white',
    bg: config.theme.primary,
    border: {
      fg: config.theme.accent,
    },
  },
});

screen.render();
```

These examples demonstrate how to leverage TypeScript's type system for safer and more maintainable blessed applications.
