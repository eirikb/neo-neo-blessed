/**
 * blessed - a high-level terminal interface library for node.js
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

import program from './program.js';
import tput, { sprintf, tryRead } from './tput.js';
import widget from './widget.js';
import * as colors from './colors.js';
import * as unicode from './unicode.js';
import * as helpers from './helpers.js';
import './events.js'; // Apply EventEmitter extensions

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

blessed.program = blessed.Program = program;
blessed.tput = blessed.Tput = tput;
blessed.widget = widget;
blessed.colors = colors;
blessed.unicode = unicode;
blessed.helpers = helpers;

(blessed.helpers as any).sprintf = sprintf;
(blessed.helpers as any).tryRead = tryRead;
blessed.helpers.merge(blessed, blessed.helpers);

blessed.helpers.merge(blessed, blessed.widget);

/**
 * Expose
 */

export default blessed;
