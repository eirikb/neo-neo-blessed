/**
 * ansi-viewer
 * ANSI art viewer for node.
 * Copyright (c) 2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

import * as blessed from '../../lib/blessed';
import * as fs from 'fs';
import * as singlebyte from './singlebyte';

// Note: request would need to be installed separately
const request = require('request');

// $ wget -r -o log --tries=10 'http://artscene.textfiles.com/ansi/'
// $ grep 'http.*\.ans$' log | awk '{ print $3 }' > ansi-art.list

const urls = fs
  .readFileSync(__dirname + '/ansi-art.list', 'utf8')
  .trim()
  .split('\n');

const map = urls.reduce(function (map: Record<string, string>, url: string) {
  const match = /([^.\/]+\/[^.\/]+)\.ans$/.exec(url);
  if (match) {
    map[match[1]] = url;
  }
  return map;
}, {});

const max =
  Object.keys(map).reduce(function (out: number, text: string) {
    return Math.max(out, text.length);
  }, 0) + 6;

const screen = blessed.screen({
  smartCSR: true,
  dockBorders: true,
});

const art = blessed.terminal({
  parent: screen,
  left: 0,
  top: 0,
  height: 60,
  // some are 78/80, some are 80/82
  width: 82,
  border: 'line',
  tags: true,
  label: ' {bold}{cyan-fg}ANSI Art{/cyan-fg}{/bold} (Drag Me) ',
  handler: function () {},
  draggable: true,
});

const list = blessed.list({
  parent: screen,
  label: ' {bold}{cyan-fg}Art List{/cyan-fg}{/bold} (Drag Me) ',
  tags: true,
  draggable: true,
  top: 0,
  right: 0,
  width: max,
  height: '50%',
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
  search: function (callback: (err: Error | null, value?: string) => void) {
    prompt.input('Search:', '', function (err: Error | null, value: string) {
      if (err) return;
      return callback(null, value);
    });
  },
});

const status = blessed.box({
  parent: screen,
  bottom: 0,
  right: 0,
  height: 1,
  width: 'shrink',
  style: {
    bg: 'blue',
  },
  content: 'Select your piece of ANSI art (`/` to search).',
});

const loader = blessed.loading({
  parent: screen,
  top: 'center',
  left: 'center',
  height: 5,
  align: 'center',
  width: '50%',
  tags: true,
  hidden: true,
  border: 'line',
});

const msg = blessed.message({
  parent: screen,
  top: 'center',
  left: 'center',
  height: 'shrink',
  width: '50%',
  align: 'center',
  tags: true,
  hidden: true,
  border: 'line',
});

const prompt = blessed.prompt({
  parent: screen,
  top: 'center',
  left: 'center',
  height: 'shrink',
  width: 'shrink',
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: 'line',
  hidden: true,
});

list.setItems(Object.keys(map));

list.on('select', function (el: any, selected: number) {
  if ((list as any)._.rendering) return;

  const name = el.getText();
  const url = map[name];

  status.setContent(url);

  (list as any)._.rendering = true;
  loader.load('Loading...');

  request(
    {
      uri: url,
      encoding: null,
    },
    function (err: Error | null, res: any, body: Buffer) {
      (list as any)._.rendering = false;
      loader.stop();

      if (err) {
        return msg.error(err.message);
      }

      if (!body) {
        return msg.error('No body.');
      }

      return cp437ToUtf8(body, function (err: Error | null, bodyText?: string) {
        if (err) {
          return msg.error(err.message);
        }

        if (!bodyText) {
          return msg.error('No converted body.');
        }

        if (process.argv[2] === '--debug') {
          const filename = name.replace(/\//g, '.') + '.ans';
          fs.writeFileSync(__dirname + '/' + filename, bodyText);
        }

        // Remove text:
        bodyText = bodyText.replace(
          'Downloaded From P-80 International Information Systems 304-744-2253',
          ''
        );

        // Remove MCI codes:
        bodyText = bodyText.replace(/%[A-Z0-9]{2}/g, '');

        // ^A (SOH) seems to need to produce CRLF in some cases??
        // bodyText = bodyText.replace(/\x01/g, '\r\n');

        // Reset and write the art:
        (art as any).term.reset();
        (art as any).term.write(bodyText);
        (art as any).term.cursorHidden = true;

        screen.render();

        if (process.argv[2] === '--debug' || process.argv[2] === '--save') {
          takeScreenshot(name);
        }
      });
    }
  );
});

list.items.forEach(function (item: any, i: number) {
  const text = item.getText();
  item.setHover(map[text]);
});

list.focus();
list.enterSelected(0);

screen.key('h', function () {
  list.toggle();
  if (list.visible) list.focus();
});

screen.key('r', function () {
  shuffle();
});

screen.key('S-s', function () {
  takeScreenshot((list as any).ritems[(list as any).selected]);
});

screen.key('s', function () {
  slideshow();
});

screen.key('q', function () {
  return process.exit(0);
});

screen.render();

/**
 * Helpers
 */

// https://github.com/chjj/blessed/issues/127
// https://github.com/Mithgol/node-singlebyte

function cp437ToUtf8(
  buf: Buffer,
  callback: (err: Error | null, result?: string) => void
): void {
  try {
    return callback(null, singlebyte.bufToStr(buf, 'cp437'));
  } catch (e) {
    return callback(e as Error);
  }
}

// Animating ANSI art doesn't work for screenshots.
const ANIMATING = [
  'bbs/void3',
  'holiday/xmasfwks',
  'unsorted/diver',
  'unsorted/mash-chp',
  'unsorted/ryans47',
  'unsorted/xmasfwks',
];

function takeScreenshot(name: string): void {
  const filename = name.replace(/\//g, '.') + '.ans.sgr';
  let image: string;
  // Animating art hangs terminal during screenshot as of right now.
  if (~ANIMATING.indexOf(name)) {
    image = (blessed.element.prototype as any).screenshot.call(
      art,
      0 - (art as any).ileft,
      art.width - (art as any).iright,
      0 - (art as any).itop,
      art.height - (art as any).ibottom
    );
  } else {
    image = (art as any).screenshot();
  }
  fs.writeFileSync(__dirname + '/' + filename, image);
  msg.display('Screenshot taken.');
}

function slideshow(): void {
  if (!(screen as any)._.slideshow) {
    (screen as any)._.slideshow = setInterval(
      (function slide() {
        if ((screen as any).lockKeys) return;
        const i = ((list.items.length - 1) * Math.random()) | 0;
        list.enterSelected(i);
        return slide;
      })(),
      3000
    );
    msg.display('Slideshow started.');
  } else {
    clearInterval((screen as any)._.slideshow);
    delete (screen as any)._.slideshow;
    msg.display('Slideshow stopped.');
  }
}

function shuffle(): void {
  const items = Object.keys(map).sort(function (key: string) {
    return Math.random() > 0.5 ? 1 : -1;
  });
  list.setItems(items);
  screen.render();
  msg.display('Shuffled items.');
}
