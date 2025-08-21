import blessed from '../dist/blessed.js';

const screen = blessed.screen({
  autoPadding: true,
  warnings: true,
  debug: true,
});

console.log('Creating list...');

const list = blessed.list({
  parent: screen,
  top: 0,
  left: 0,
  width: '50%',
  height: '100%',
  border: 'line',
  label: 'Test List',
  mouse: true,
  keys: true,
  interactive: true,
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'green' },
    selected: {
      bg: 'blue',
      fg: 'yellow',
      bold: true,
    },
    item: {
      fg: 'cyan',
    },
  },
  items: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
});

console.log('List created. Selected item:', list.selected);
console.log('List items count:', list.items.length);
console.log('List interactive:', list.interactive);
console.log('Selected style:', list.style.selected);
console.log('Item style:', list.style.item);

// Debug current selection
console.log('First item style:', list.items[0]?.style);

// Test the select method manually to see debug output
console.log('Manually triggering select...');
list.select(0); // This should apply styles to first item

list.on('select item', (item, index) => {
  console.log('Selection changed to:', index, item.content || item);
});

list.focus();

// Simulate navigation after a short delay
setTimeout(() => {
  console.log('Moving down...');
  list.down();
  screen.render();

  setTimeout(() => {
    console.log('Current selection:', list.selected);
    console.log('Selected item style:', list.items[list.selected]?.style);

    setTimeout(() => {
      screen.destroy();
    }, 1000);
  }, 500);
}, 1000);

screen.key('q', () => screen.destroy());

screen.render();

// Keep the process alive
setTimeout(() => {}, 5000);
