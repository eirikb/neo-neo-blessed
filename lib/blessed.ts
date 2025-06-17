/**
 * blessed - a high-level terminal interface library for node.js
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * The main blessed namespace that provides access to all widgets and functionality.
 *
 * @example
 * ```typescript
 * import blessed from 'neo-neo-blessed';
 *
 * const screen = blessed.screen({
 *   smartCSR: true
 * });
 *
 * const box = blessed.box({
 *   parent: screen,
 *   top: 'center',
 *   left: 'center',
 *   width: '50%',
 *   height: '50%',
 *   content: 'Hello World!',
 *   tags: true,
 *   border: {
 *     type: 'line'
 *   },
 *   style: {
 *     fg: 'white',
 *     bg: 'magenta',
 *     border: {
 *       fg: '#f0f0f0'
 *     },
 *     hover: {
 *       bg: 'green'
 *     }
 *   }
 * });
 *
 * screen.render();
 * ```
 */
function blessed() {
  return blessed.program.apply(null, arguments);
}

blessed.program = blessed.Program = require('./program');
blessed.tput = blessed.Tput = require('./tput');
blessed.widget = require('./widget');
blessed.colors = require('./colors');
blessed.unicode = require('./unicode');
blessed.helpers = require('./helpers');

blessed.helpers.sprintf = blessed.tput.sprintf;
blessed.helpers.tryRead = blessed.tput.tryRead;
blessed.helpers.merge(blessed, blessed.helpers);

blessed.helpers.merge(blessed, blessed.widget);

/**
 * Expose
 */

module.exports = blessed;
