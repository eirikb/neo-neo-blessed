var Node = require('./node');
var Box = require('./box');

function Terminal(this: any, options?: any) {
  if (!(this instanceof Node)) {
    return new Terminal(options);
  }

  options = options || {};
  Box.call(this, options);

  this.shell = options.shell || process.env.SHELL || 'bash';
  this.args = options.args || [];

  this.bootstrap(options);
}

Terminal.prototype.__proto__ = Box.prototype;
Terminal.prototype.type = 'terminal';

Terminal.prototype.bootstrap = function (options: any) {
  var self = this;

  var cols = 80;
  var rows = 24;

  if (this.width > 0 && this.height > 0) {
    cols = Math.max(this.width - this.iwidth, 1);
    rows = Math.max(this.height - this.iheight, 1);
  }

  const { Terminal: XTerminal } = require('@xterm/headless');
  const { spawn } = require('node-pty');

  this.term = new XTerminal({
    cols: cols,
    rows: rows,
    scrollback: 5000,
    allowProposedApi: true,
  });

  this.pty = spawn(this.shell, this.args, {
    cols: cols,
    rows: rows,
    cwd: process.env.HOME,
  });

  this.term.onData(d => this.pty.write(d));
  this.pty.onData(d => this.term.write(d));

  this.screen.program.input.on(
    'data',
    (this._onData = function (data: any) {
      if (self.screen.focused === self) {
        self.term.input(data.toString());
      }
    })
  );

  this.pty.onData(() => {
    setTimeout(() => self.screen.render(), 16);
  });

  this.on('resize', function () {
    var cols = Math.max(self.width - self.iwidth, 1);
    var rows = Math.max(self.height - self.iheight, 1);
    self.term.resize(cols, rows);
    self.pty.resize(cols, rows);
  });

  this.once('render', function () {
    var actualCols = Math.max(self.width - self.iwidth, 1);
    var actualRows = Math.max(self.height - self.iheight, 1);
    if (actualCols !== cols || actualRows !== rows) {
      self.term.resize(actualCols, actualRows);
      self.pty.resize(actualCols, actualRows);
    }
  });

  this.on('destroy', () => this.kill());
};

Terminal.prototype.render = function () {
  var ret = this._render();
  if (!ret) return;

  var xi = ret.xi + this.ileft;
  var xl = ret.xl - this.iright;
  var yi = ret.yi + this.itop;
  var yl = ret.yl - this.ibottom;

  xi = Math.max(xi, 0);
  xl = Math.min(xl, this.screen.width);
  yi = Math.max(yi, 0);
  yl = Math.min(yl, this.screen.height);

  if (xi >= xl || yi >= yl) return ret;

  const buf = this.term.buffer.active;
  for (var y = yi; y < yl; y++) {
    var line = this.screen.lines[y];
    if (!line) continue;

    var bufferY = y - yi;
    var bufferLine = buf.getLine(bufferY);
    if (!bufferLine) continue;

    for (var x = xi; x < xl; x++) {
      if (!line[x]) continue;

      var cellX = x - xi;
      var cell = bufferLine.getCell(cellX);
      if (!cell) continue;

      line[x][1] = cell.getChars() || ' ';

      var attr = this.dattr || (0x07 << 9) | 0x00;

      if (cell.isBold()) attr |= 1 << 18;
      if (cell.isUnderline()) attr |= 2 << 18;
      if (cell.isInverse()) attr |= 8 << 18;

      var fg = cell.getFgColor();
      var bg = cell.getBgColor();

      if (fg !== undefined && fg !== -1) {
        attr = (attr & ~(0x1ff << 9)) | ((fg & 0x1ff) << 9);
      } else {
        attr = (attr & ~(0x1ff << 9)) | (0x07 << 9);
      }

      if (bg !== undefined && bg !== -1) {
        attr = (attr & ~0x1ff) | (bg & 0x1ff);
      } else {
        attr = (attr & ~0x1ff) | 0x00;
      }

      line[x][0] = attr;
    }
    line.dirty = true;
  }

  return ret;
};

Terminal.prototype.kill = function () {
  if (this.pty) this.pty.kill();
  if (this.term) this.term.dispose();
  this.screen.program.input.removeListener('data', this._onData);
};

module.exports = Terminal;
