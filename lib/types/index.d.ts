/**
 * Core TypeScript definitions for neo-neo-blessed
 * These interfaces define the fundamental types used throughout the library
 */

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

// ==============================================
// Core Base Interfaces
// ==============================================

export interface Position {
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  width?: number | string;
  height?: number | string;
}

export interface Padding {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export interface Border {
  type?: string;
  fg?: string;
  bg?: string;
  ch?: string;
  top?: boolean | string;
  left?: boolean | string;
  right?: boolean | string;
  bottom?: boolean | string;
}

export interface Style {
  fg?: string;
  bg?: string;
  bold?: boolean;
  underline?: boolean;
  blink?: boolean;
  inverse?: boolean;
  invisible?: boolean;
  transparent?: boolean;
  [key: string]: any;
}

// ==============================================
// Event System Interfaces
// ==============================================

export interface EventEmitterInterface extends EventEmitter {
  _events?: { [type: string]: Function | Function[] };
  _maxListeners?: number;

  on(event: string, listener: Function): this;
  off(event: string, listener: Function): this;
  emit(event: string, ...args: any[]): boolean;
  once(event: string, listener: Function): this;
  removeAllListeners(type?: string): this;
  listeners(type: string): Function[];
  _emit(type: string, args: any[]): any;
}

// ==============================================
// Core Node Interface - Base for all widgets
// ==============================================

export interface NodeOptions {
  screen?: ScreenInterface;
  parent?: NodeInterface;
  children?: NodeInterface[];
  data?: { [key: string]: any };
  [key: string]: any;
}

export interface NodeInterface extends EventEmitterInterface {
  readonly type: string;
  options: NodeOptions;
  screen: ScreenInterface;
  parent: NodeInterface | null;
  children: NodeInterface[];
  data: { [key: string]: any };
  uid: number;
  index: number;
  detached: boolean;

  // Tree manipulation methods
  insert(element: NodeInterface, i?: number): void;
  append(element: NodeInterface): void;
  prepend(element: NodeInterface): void;
  insertBefore(element: NodeInterface, other: NodeInterface): void;
  insertAfter(element: NodeInterface, other: NodeInterface): void;
  remove(element: NodeInterface): NodeInterface;
  detach(): NodeInterface;
  free(): void;
  destroy(): void;

  // Tree traversal
  get(name: string, def?: any): any;
  set(name: string, value: any): any;
}

// ==============================================
// Element Interface - Visual elements
// ==============================================

export interface ElementOptions extends NodeOptions, Position {
  style?: Style;
  border?: Border;
  padding?: Padding | number;
  margin?: Padding | number;
  content?: string;
  tags?: boolean;
  hidden?: boolean;
  visible?: boolean;
  scrollable?: boolean;
  clickable?: boolean;
  keyable?: boolean;
  mouse?: boolean;
  keys?: boolean;
  vi?: boolean;
  autoFocus?: boolean;
  draggable?: boolean;
  shadow?: boolean;
  [key: string]: any;
}

export interface ElementInterface extends NodeInterface {
  // Position properties (absolute coordinates)
  aleft: number;
  aright: number;
  atop: number;
  abottom: number;

  // Dimensions
  width: number;
  height: number;

  // Inner dimensions (excluding border/padding)
  iwidth: number;
  iheight: number;
  ileft: number;
  iright: number;
  itop: number;
  ibottom: number;

  // Relative position
  rleft: number;
  rright: number;
  rtop: number;
  rbottom: number;

  // Content and styling
  content: string;
  hidden: boolean;
  visible: boolean;
  style: Style;
  border?: Border;
  padding?: Padding;
  margin?: Padding;

  // Focus state
  focused: boolean;

  // Core methods
  hide(): ElementInterface;
  show(): ElementInterface;
  toggle(): ElementInterface;
  focus(): ElementInterface;
  blur(): ElementInterface;

  // Content methods
  setContent(content: string): ElementInterface;
  getContent(): string;
  setText(content: string): ElementInterface;
  getText(): string;
  insertText(text: string, attr?: any): ElementInterface;
  deleteText(start: number, end: number): ElementInterface;

  // Rendering
  render(): any;
  clearPos(get?: boolean): any;
  lpos: any;

  // Positioning
  enableMouse(): void;
  enableKeys(): void;
  enableInput(): void;
  onScreenEvent(type: string, listener: Function): void;
  removeScreenEvent(type: string, listener: Function): void;
  free(): void;
  kill(): void;
  destroy(): void;

  // Screenshot
  screenshot(xi?: number, xl?: number, yi?: number, yl?: number): string;

  // Style methods
  sattr(style: Style): number;
}

// ==============================================
// Box Interface - Container widgets
// ==============================================

export interface BoxOptions extends ElementOptions {
  label?: string;
  hoverText?: string;
  [key: string]: any;
}

export interface BoxInterface extends ElementInterface {
  // Additional box-specific functionality would go here
}

// ==============================================
// Program Interface - Terminal control
// ==============================================

export interface ProgramOptions {
  input?: Readable;
  output?: Writable;
  log?: string;
  dump?: string;
  term?: string;
  terminal?: string;
  debug?: boolean;
  resizeTimeout?: number;
  [key: string]: any;
}

export interface ProgramInterface extends EventEmitterInterface {
  input: Readable;
  output: Writable;

  // Terminal state
  terminal: string;
  isAlt: boolean;
  x: number;
  y: number;
  savedX: number;
  savedY: number;
  cols: number;
  rows: number;
  scrollTop: number;
  scrollBottom: number;

  // Terminal control
  write(text: string): boolean;
  flush(): void;
  clear(): boolean;
  reset(): boolean;

  // Cursor control
  cup(row: number, col: number): boolean;
  cursorPos(): { x: number; y: number };
  hideCursor(): boolean;
  showCursor(): boolean;
  saveCursor(): boolean;
  restoreCursor(): boolean;

  // Screen control
  alternateBuffer(): boolean;
  normalBuffer(): boolean;
  csr(top: number, bottom: number): boolean;

  // Input handling
  enableMouse(): void;
  disableMouse(): void;
  setMouse(opt?: any, force?: boolean): void;

  // Events
  key(keys: string | string[], callback: Function): void;
  onceKey(keys: string | string[], callback: Function): void;
  unkey(keys: string | string[], callback: Function): void;
  bindMouse(): void;
  bindKeys(): void;

  // Cleanup
  destroy(): void;
}

// ==============================================
// Screen Interface - Top-level container
// ==============================================

export interface ScreenOptions extends ElementOptions {
  program?: ProgramInterface;
  smartCSR?: boolean;
  fastCSR?: boolean;
  useBCE?: boolean;
  resizeTimeout?: number;
  tabSize?: number;
  autoPadding?: boolean;
  cursor?: {
    artificial?: boolean;
    shape?: string;
    blink?: boolean;
    color?: string;
  };
  log?: string;
  dump?: string;
  debug?: boolean;
  warnings?: boolean;
  [key: string]: any;
}

export interface ScreenInterface extends ElementInterface {
  program: ProgramInterface;

  // Focus management
  focused: ElementInterface | null;
  grabKeys: boolean;
  lockKeys: boolean;

  // Screen state
  title: string;

  // Rendering
  lines: any[][];
  olines: any[][];

  // Methods
  render(): void;
  draw(start: number, end: number): void;
  alloc(): void;
  realloc(): void;

  // Focus methods
  saveFocus(): ElementInterface | null;
  restoreFocus(): ElementInterface | null;
  rewindFocus(): ElementInterface | null;
  focusOffset(offset: number): ElementInterface | null;
  focusNext(): ElementInterface | null;
  focusPrevious(): ElementInterface | null;
  focusPush(element: ElementInterface): void;
  focusPop(): ElementInterface | null;

  // Input handling
  key(keys: string | string[], callback: Function): void;
  onceKey(keys: string | string[], callback: Function): void;
  unkey(keys: string | string[], callback: Function): void;
  spawn(file: string, args?: string[], options?: any): any;
  exec(file: string, args?: string[], options?: any, callback?: Function): any;
  readEditor(options?: any, callback?: Function): void;
  setEffects(
    el: ElementInterface,
    fel: ElementInterface,
    over: any,
    out: any,
    effects: any,
    temp: any
  ): void;

  // Screen control
  enter(): void;
  leave(): void;
  postEnter(): void;

  // Event binding
  bindMouse(): void;
  bindKeys(): void;

  // Cleanup
  destroy(): void;

  // Debugging
  screenshot(
    xi?: number,
    xl?: number,
    yi?: number,
    yl?: number,
    term?: any
  ): string;
  copyToClipboard(text: string): void;
  cursorShape(shape: string, blink?: boolean): boolean;
  cursorColor(color: string): boolean;
  cursorReset(): boolean;

  // Title
  setTitle(title: string): boolean;

  // Warnings
  _exceptionHandler: Function;
}
