#!/usr/bin/env node

/**
 * A clock using blessed
 * Copyright (c) 2013, Christopher Jeffrey (MIT License).
 * https://github.com/chjj/blessed
 */

process.title = 'time.js';

const argv = process.argv;

if (~argv.indexOf('-h') || ~argv.indexOf('--help')) {
  console.log('Options:');
  console.log('-s - Show seconds.');
  console.log('-n - No leading zero on hours.');
  console.log('-d - Show date box.');
  console.log('--skinny - Skinny text.');
  process.exit(0);
}

import * as blessed from '../lib/blessed';

const screen = blessed.screen({
  autoPadding: true,
});

let lastTime: string;

interface SymbolMap {
  [key: string]: blessed.Widgets.BoxElement;
}

interface PositionMap {
  [key: number]: SymbolMap;
}

const positions: PositionMap = {};

const container = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: 'shrink',
  height: 9,
});

// Workaround for centering shrunken box.
container.on('prerender', function () {
  const lpos = container._getCoords(true);
  if (lpos) {
    container.rleft = ((screen.width - (lpos.xl - lpos.xi)) / 2) | 0;
  }
});

const date = blessed.box({
  parent: screen,
  top: 1,
  left: 1,
  width: 'shrink',
  height: 'shrink',
  border: {
    type: 'line',
    fg: 'black',
  },
});

date.hide();

const wid = ~argv.indexOf('--skinny') ? 1 : 2;
const bch = '│';
const inverse = true;

// var bch = '*';
// var bch = '·';
// var bch = '│';
// var bch = '◆';
// var bch = '▪';
// var inverse = false;

// TODO: Potentially make height of each char 9 instead
// of 8 so we can vertically center horizontal lines
// in 4, 8, etc.

for (let i = 0; i < 10; i++) {
  const symbols: SymbolMap = (positions[i] = {});

  /**
   * Zero
   */

  symbols[0] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[0],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[0],
    top: 0,
    left: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[0],
    top: 0,
    right: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[0],
    top: 8,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[0].hide();

  /**
   * One
   */

  symbols[1] = blessed.box({
    parent: container,
    top: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[1],
    top: 0,
    left: 'center',
    width: 2,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[1].hide();

  /**
   * Two
   */

  symbols[2] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[2],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[2],
    top: 0,
    right: 0,
    height: 4,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[2],
    top: 4,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[2],
    top: 4,
    left: 0,
    height: 4,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[2],
    top: 8,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[2].hide();

  /**
   * Three
   */

  symbols[3] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[3],
    top: 0,
    bottom: 0,
    right: 0,
    width: wid,
    height: 9,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[3],
    top: 0,
    right: 0,
    left: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[3],
    top: 4,
    right: 0,
    left: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[3],
    top: 8,
    right: 0,
    left: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[3].hide();

  /**
   * Four
   */

  symbols[4] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[4],
    top: 0,
    bottom: 0,
    right: 0,
    width: wid,
    height: 9,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[4],
    top: 4,
    right: 0,
    left: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[4],
    top: 0,
    left: 0,
    width: wid,
    height: 4,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[4].hide();

  /**
   * Five
   */

  symbols[5] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[5],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[5],
    top: 0,
    left: 0,
    height: 4,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[5],
    top: 4,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[5],
    top: 4,
    right: 0,
    height: 4,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[5],
    top: 8,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[5].hide();

  /**
   * Six
   */

  symbols[6] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[6],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[6],
    top: 0,
    left: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[6],
    top: 4,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[6],
    top: 4,
    right: 0,
    height: 4,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[6],
    top: 8,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[6].hide();

  /**
   * Seven
   */

  symbols[7] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[7],
    top: 0,
    bottom: 0,
    right: 0,
    width: wid,
    height: 9,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[7],
    top: 0,
    right: 0,
    left: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[7].hide();

  /**
   * Eight
   */

  symbols[8] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[8],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[8],
    top: 0,
    left: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[8],
    top: 4,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[8],
    top: 0,
    right: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[8],
    top: 8,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[8].hide();

  /**
   * Nine
   */

  symbols[9] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 10,
    height: 9,
  });

  blessed.box({
    parent: symbols[9],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[9],
    top: 0,
    left: 0,
    height: 4,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[9],
    top: 4,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[9],
    top: 0,
    right: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[9],
    top: 8,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'default',
      inverse: inverse,
    },
  });

  symbols[9].hide();

  /**
   * Colon
   */

  symbols[':'] = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: 5,
    height: 9,
  });

  blessed.box({
    parent: symbols[':'],
    top: 3,
    left: 'center',
    width: 2,
    height: 1,
    ch: bch,
    style: {
      fg: 'black',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols[':'],
    top: 6,
    left: 'center',
    width: 2,
    height: 1,
    ch: bch,
    style: {
      fg: 'black',
      inverse: inverse,
    },
  });

  symbols[':'].hide();

  /**
   * A
   */

  symbols['a'] = blessed.box({
    parent: container,
    top: 2,
    left: 0,
    width: 10,
    height: 7,
  });

  blessed.box({
    parent: symbols['a'],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['a'],
    top: 0,
    left: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['a'],
    top: 3,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['a'],
    top: 0,
    right: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  symbols['a'].hide();

  /**
   * P
   */

  symbols['p'] = blessed.box({
    parent: container,
    top: 2,
    left: 0,
    width: 10,
    height: 7,
  });

  blessed.box({
    parent: symbols['p'],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['p'],
    top: 0,
    right: 0,
    height: 4,
    width: wid,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['p'],
    top: 0,
    left: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['p'],
    top: 3,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'blue',
      inverse: inverse,
    },
  });

  symbols['p'].hide();

  /**
   * M
   */

  symbols['m'] = blessed.box({
    parent: container,
    top: 2,
    left: 0,
    width: 10,
    height: 7,
  });

  blessed.box({
    parent: symbols['m'],
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    ch: bch,
    style: {
      fg: 'black',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['m'],
    top: 0,
    left: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'black',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['m'],
    top: 0,
    right: 0,
    bottom: 0,
    width: wid,
    ch: bch,
    style: {
      fg: 'black',
      inverse: inverse,
    },
  });

  blessed.box({
    parent: symbols['m'],
    top: 0,
    bottom: 0,
    left: 'center',
    width: wid,
    ch: bch,
    style: {
      fg: 'black',
      inverse: inverse,
    },
  });

  symbols['m'].hide();
}

function updateTime(): void {
  let pos = 0;
  const d = new Date();
  let im = 'am';
  let time: string;
  let h: number | string;
  let m: number | string;
  let s: number | string;

  h = d.getHours();
  if (h >= 12) {
    im = 'pm';
  }
  if (h > 12) {
    h -= 12;
  }
  if (h === 0) h = 12;
  if (h < 10) {
    h = '0' + h;
  }

  m = d.getMinutes();
  if (m < 10) {
    m = '0' + m;
  }

  s = d.getSeconds();
  if (s < 10) {
    s = '0' + s;
  }

  time = ~argv.indexOf('-s') ? h + ':' + m + ':' + s + im : h + ':' + m + im;

  if (time === lastTime) return;
  lastTime = time;

  const timeChars = time.split('');

  if (~argv.indexOf('-n')) {
    if (timeChars[0] === '0') timeChars[0] = ' ';
  }

  Object.keys(positions).forEach(function (key) {
    const symbols = positions[parseInt(key)];
    Object.keys(symbols).forEach(function (symbolKey) {
      symbols[symbolKey].hide();
    });
  });

  timeChars.forEach(function (ch, i) {
    const symbols = positions[i];
    const symbol = symbols[ch];

    if (!symbol) return;

    symbol.rleft = pos;
    pos += symbol.width + 2;

    symbol.show();
  });

  if (~argv.indexOf('-d')) {
    date.show();
    date.setContent(d.toISOString().replace(/\.\d+/, ''));
  }

  screen.render();
}

setInterval(updateTime, ~argv.indexOf('-s') ? 100 : 950);

updateTime();

screen.key('q', function () {
  process.exit(0);
});
