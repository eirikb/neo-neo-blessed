import blessed from '../dist/blessed.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const screen = blessed.screen({
  dump: __dirname + '/logs/list.log',
  autoPadding: true,
  warnings: true,
});

// Info box to show selection details
const infoBox = blessed.box({
  parent: screen,
  top: 0,
  right: 0,
  width: 30,
  height: 8,
  border: 'line',
  label: 'Selection Info',
  content: 'Navigate with arrows\nPress Enter to select\nPress q to quit',
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
  },
});

// Main list widget
const list = blessed.list({
  parent: screen,
  top: 0,
  left: 0,
  width: '70%',
  height: '100%',
  border: 'line',
  label: 'List Widget Test',
  mouse: true,
  keys: true,
  vi: true,
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'green' },
    selected: {
      bg: 'blue',
      fg: 'white',
      bold: true,
    },
    item: {
      fg: 'cyan',
    },
  },
  items: [
    'Option 1: Files',
    'Option 2: Edit',
    'Option 3: View',
    'Option 4: Search',
    'Option 5: Terminal',
    'Option 6: Help',
    'Option 7: Settings',
    'Option 8: Debug',
    'Option 9: Extensions',
    'Option 10: Source Control',
    'Option 11: Run and Debug',
    'Option 12: Remote Explorer',
    'Option 13: Database',
    'Option 14: API Client',
    'Option 15: Docker',
  ],
});

// Update info box when selection changes
function updateInfo() {
  const selected = list.selected;
  const value = list.value;
  const total = list.items.length;

  infoBox.setContent(
    `Selected Index: ${selected}\n` +
      `Selected Item: ${value}\n` +
      `Total Items: ${total}\n\n` +
      `Navigation:\n` +
      `↑/k - Up\n` +
      `↓/j - Down\n` +
      `Enter - Select\n` +
      `q - Quit`
  );
  screen.render();
}

// Handle selection events
list.on('select item', function (item, index) {
  infoBox.setContent(
    `SELECTED!\n\n` +
      `Index: ${index}\n` +
      `Item: ${item.content || item}\n\n` +
      `Press any key to continue...`
  );
  screen.render();
});

// Handle selection changes (navigation)
list.on('select', function () {
  updateInfo();
});

// Handle mouse clicks
list.on('click', function () {
  updateInfo();
});

// Key events are handled by the list widget's built-in keypress handler
// We just need to update the info when selection changes

list.key(['enter', 'space'], function () {
  const selected = list.selected;
  const item = list.items[selected];
  list.emit('select item', item, selected);
});

// Focus the list
list.focus();

// Initial info update
updateInfo();

// Quit on 'q'
screen.key('q', function () {
  return screen.destroy();
});

screen.render();
