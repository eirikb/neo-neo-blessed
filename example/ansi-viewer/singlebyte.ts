/**
 * node-singlebyte
 */

// The MIT License (MIT)
//
// Copyright (c) 2013, Sergey Sokoloff (aka Mithgol the Webmaster).
// https://github.com/Mithgol/node-singlebyte
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

interface EncodingEntry {
  name: string;
  table: number[];
}

interface StrToBufOptions {
  defaultCode?: number;
}

const extend = function (target: any, ...sources: any[]): any {
  target = target || {};
  sources.forEach(function (obj) {
    Object.keys(obj || {}).forEach(function (key) {
      target[key] = obj[key];
    });
  });
  return target;
};

class SingleByte {
  encodings: EncodingEntry[] = [];

  errors = {
    NOT_A_BUFFER: 'The given source is not a buffer!',
    UNKNOWN_ENCODING: 'The given encoding is not defined!',
    INVALID_TABLE_LENGTH: 'The encoding table must have 256 elements!',
    INVALID_EXTENSION: 'The ASCII extension table must have 128 elements!',
    BUFFER_ENCODING: "Cannot redefine a Node's encoding!",
    OUT_OF_UNICODE: "An encoding table's element is greater than 0x10FFFF!",
  };

  constructor() {
    // CP437
    this.learnEncoding(
      'cp437',
      this.extendASCII([
        0xc7, 0xfc, 0xe9, 0xe2, 0xe4, 0xe0, 0xe5, 0xe7, 0xea, 0xeb, 0xe8, 0xef,
        0xee, 0xec, 0xc4, 0xc5, 0xc9, 0xe6, 0xc6, 0xf4, 0xf6, 0xf2, 0xfb, 0xf9,
        0xff, 0xd6, 0xdc, 0xa2, 0xa3, 0xa5, 0x20a7, 0x192, 0xe1, 0xed, 0xf3,
        0xfa, 0xf1, 0xd1, 0xaa, 0xba, 0xbf, 0x2310, 0xac, 0xbd, 0xbc, 0xa1,
        0xab, 0xbb, 0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562,
        0x2556, 0x2555, 0x2563, 0x2551, 0x2557, 0x255d, 0x255c, 0x255b, 0x2510,
        0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x255e, 0x255f, 0x255a,
        0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x2567, 0x2568, 0x2564,
        0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256b, 0x256a, 0x2518, 0x250c,
        0x2588, 0x2584, 0x258c, 0x2590, 0x2580, 0x3b1, 0x3b2, 0x393, 0x3c0,
        0x3a3, 0x3c3, 0x3bc, 0x3c4, 0x3a6, 0x398, 0x3a9, 0x3b4, 0x221e, 0x3c6,
        0x3b5, 0x2229, 0x2261, 0xb1, 0x2265, 0x2264, 0x2320, 0x2321, 0xf7,
        0x2248, 0xb0, 0x2219, 0xb7, 0x221a, 0x207f, 0xb2, 0x25a0, 0xa0,
      ])
    );

    // Add other encodings as needed...
  }

  isEncoding(encodingName: string): boolean {
    if (Buffer.isEncoding(encodingName)) return true;
    for (let i = 0; i < this.encodings.length; i++) {
      if (this.encodings[i].name === encodingName) return true;
    }
    return false;
  }

  learnEncoding(encodingName: string, encodingTable: number[]): void {
    if (Buffer.isEncoding(encodingName)) {
      throw new Error(this.errors.BUFFER_ENCODING);
    }

    if (encodingTable.length !== 256) {
      throw new Error(this.errors.INVALID_TABLE_LENGTH);
    }

    const _this = this;
    encodingTable = encodingTable.map(function (item) {
      const nextCode = item | 0;
      if (0 > nextCode || nextCode > 0x10ffff) {
        throw new Error(_this.errors.OUT_OF_UNICODE);
      }
      return item;
    });

    if (this.isEncoding(encodingName)) {
      for (let i = 0; i < this.encodings.length; i++) {
        if (this.encodings[i].name === encodingName) {
          this.encodings[i].table = encodingTable;
          return;
        }
      }
    } else {
      this.encodings.push({
        name: encodingName,
        table: encodingTable,
      });
    }
  }

  getEncodingTable(encodingName: string): number[] | null {
    for (let i = 0; i < this.encodings.length; i++) {
      if (this.encodings[i].name === encodingName) {
        return this.encodings[i].table;
      }
    }
    return null;
  }

  extendASCII(extensionTable: number[]): number[] {
    if (extensionTable.length !== 128) {
      throw new Error(this.errors.INVALID_EXTENSION);
    }

    const output: number[] = [];
    for (let i = 0; i < 128; i++) output.push(i);
    return output.concat(extensionTable);
  }

  bufToStr(
    buf: Buffer,
    encoding: string,
    start?: number,
    end?: number
  ): string {
    if (!Buffer.isBuffer(buf)) {
      throw new Error(this.errors.NOT_A_BUFFER);
    }
    if (Buffer.isEncoding(encoding)) {
      return buf.toString(encoding as BufferEncoding, start, end);
    }
    const table = this.getEncodingTable(encoding);
    if (table === null) throw new Error(this.errors.UNKNOWN_ENCODING);

    if (typeof end === 'undefined') end = buf.length;
    if (typeof start === 'undefined') start = 0;

    let output = '';
    let sourceValue: number;
    for (let i = start; i < end; i++) {
      sourceValue = table[buf[i]];
      if (sourceValue <= 0xffff) {
        output += String.fromCharCode(sourceValue);
      } else if (0x10000 <= sourceValue && sourceValue <= 0x10ffff) {
        sourceValue -= 0x10000;
        output += String.fromCharCode(0xd800 + (sourceValue >> 10));
        output += String.fromCharCode(0xdc00 + (sourceValue & 0x3ff));
      } else throw new Error(this.errors.OUT_OF_UNICODE);
    }
    return output;
  }

  strToBuf(
    str: string,
    encoding: string,
    encodingOptions?: StrToBufOptions
  ): Buffer {
    if (Buffer.isEncoding(encoding)) {
      return Buffer.from(str, encoding as BufferEncoding);
    }
    str = '' + str;
    const strToBufDefaults = { defaultCode: 0x3f }; // '?'
    const options = extend({}, strToBufDefaults, encodingOptions);
    const table = this.getEncodingTable(encoding);
    if (table === null) throw new Error(this.errors.UNKNOWN_ENCODING);
    const output: number[] = [];
    for (let i = 0; i < str.length; i++) {
      let charUnicode: number;
      const thisCharCode = str.charCodeAt(i);
      if (
        0xd800 <= thisCharCode &&
        thisCharCode <= 0xdbff &&
        i + 1 < str.length
      ) {
        const nextCharCode = str.charCodeAt(i + 1);
        if (0xdc00 <= nextCharCode && nextCharCode <= 0xdfff) {
          charUnicode =
            0x10000 + (thisCharCode - 0xd800) * 0x400 + (nextCharCode - 0xdc00);
          i++;
        } else {
          charUnicode = thisCharCode;
        }
      } else {
        charUnicode = thisCharCode;
      }

      const codeFoundIndex = table.indexOf(charUnicode);
      if (codeFoundIndex < 0) {
        output.push(options.defaultCode);
      } else {
        output.push(codeFoundIndex);
      }
    }
    return Buffer.from(output);
  }
}

export = new SingleByte();
