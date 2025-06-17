/**
 * Widget-specific TypeScript definitions for neo-neo-blessed
 * Defines interfaces for all the various widget types
 */

import {
  ElementInterface,
  ElementOptions,
  BoxInterface,
  BoxOptions,
  Style,
  ScreenInterface,
} from './index';

// ==============================================
// Input Widget Interfaces
// ==============================================

export interface InputOptions extends BoxOptions {
  value?: string;
  secret?: boolean;
  censor?: boolean;
}

export interface InputInterface extends BoxInterface {
  value: string;
  secret: boolean;
  censor: boolean;

  setValue(value: string): void;
  getValue(): string;
  clearValue(): void;
  submit(): void;
  cancel(): void;
  readInput(callback?: Function): void;
}

// ==============================================
// Textarea Interface
// ==============================================

export interface TextareaOptions extends InputOptions {
  mouse?: boolean;
  keys?: boolean;
  vi?: boolean;
}

export interface TextareaInterface extends InputInterface {
  // Additional textarea-specific properties and methods
}

// ==============================================
// Button Interface
// ==============================================

export interface ButtonOptions extends BoxOptions {
  mouse?: boolean;
  keys?: boolean;
  shrink?: boolean;
  padding?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
}

export interface ButtonInterface extends BoxInterface {
  press(): void;
  focus(): ButtonInterface;
  blur(): ButtonInterface;
}

// ==============================================
// Checkbox Interface
// ==============================================

export interface CheckboxOptions extends BoxOptions {
  checked?: boolean;
  mouse?: boolean;
  keys?: boolean;
  text?: string;
}

export interface CheckboxInterface extends BoxInterface {
  text: string;
  checked: boolean;
  value: boolean;

  check(): void;
  uncheck(): void;
  toggle(): void;
}

// ==============================================
// Radioset Interface
// ==============================================

export interface RadiosetOptions extends BoxOptions {
  // Radioset-specific options
}

export interface RadiosetInterface extends BoxInterface {
  // Radioset-specific methods
}

// ==============================================
// List Interface
// ==============================================

export interface ListOptions extends BoxOptions {
  items?: string[];
  selected?: number;
  mouse?: boolean;
  keys?: boolean;
  vi?: boolean;
  search?: boolean;
  interactive?: boolean;
  invertSelected?: boolean;
  style?: Style & {
    selected?: Style;
    item?: Style & {
      hover?: Style;
      focus?: Style;
    };
  };
}

export interface ListInterface extends BoxInterface {
  items: string[];
  selected: number;
  interactive: boolean;

  // Item management
  add(item: string): void;
  addItem(item: string): void;
  removeItem(child: string | number): ElementInterface;
  clearItems(): void;
  setItems(items: string[]): void;
  getItem(index: number): ElementInterface;
  getItemIndex(child: ElementInterface): number;

  // Selection
  select(index: number): void;
  move(offset: number): void;
  up(amount?: number): void;
  down(amount?: number): void;
  top(): void;
  bottom(): void;

  // Search
  search(text: string): void;
  fuzzyFind(text: string): void;
}

// ==============================================
// Scrollable Box Interface
// ==============================================

export interface ScrollableBoxOptions extends BoxOptions {
  scrollable?: boolean;
  mouse?: boolean;
  keys?: boolean;
  vi?: boolean;
  alwaysScroll?: boolean;
  scrollbar?: {
    style?: {
      fg?: string;
      bg?: string;
      bold?: boolean;
      underline?: boolean;
      inverse?: boolean;
      invisible?: boolean;
    };
    track?: {
      fg?: string;
      bg?: string;
      bold?: boolean;
      underline?: boolean;
      inverse?: boolean;
      invisible?: boolean;
    };
  };
}

export interface ScrollableBoxInterface extends BoxInterface {
  // Scrolling
  scroll(offset: number, always?: boolean): boolean;
  scrollTo(offset: number): boolean;
  setScroll(offset: number): boolean;
  getScroll(): number;
  setScrollPerc(percent: number): boolean;
  getScrollPerc(): number;
  getScrollHeight(): number;
  resetScroll(): boolean;

  // Navigation
  scrollUp(amount?: number): boolean;
  scrollDown(amount?: number): boolean;
}

// ==============================================
// Table Interface
// ==============================================

export interface TableOptions extends BoxOptions {
  rows?: string[][];
  data?: string[][];
  headers?: string[];
  align?: string;
  pad?: number;
  shrink?: boolean;
  style?: Style & {
    header?: Style;
    cell?: Style;
  };
  columnSpacing?: number;
  columnWidth?: number[];
}

export interface TableInterface extends BoxInterface {
  rows: string[][];

  // Data management
  setRows(rows: string[][]): void;
  setData(data: string[][]): void;
  getRows(): string[][];

  // Headers
  setHeaders(headers: string[]): void;
  getHeaders(): string[];
}

// ==============================================
// ListTable Interface
// ==============================================

export interface ListTableOptions extends ListOptions {
  rows?: string[][];
  data?: string[][];
  headers?: string[];
  align?: string;
  pad?: number;
  columnSpacing?: number;
  columnWidth?: number[];
}

export interface ListTableInterface extends ListInterface {
  rows: string[][];

  // Combines List and Table functionality
  setRows(rows: string[][]): void;
  setData(data: string[][]): void;
}

// ==============================================
// Terminal Interface
// ==============================================

export interface TerminalOptions extends BoxOptions {
  shell?: string;
  args?: string[];
  env?: { [key: string]: string };
  cwd?: string;
  cursor?: string;
  cursorBlink?: boolean;
  screenKeys?: boolean;
  terminal?: string;
  term?: string;
  handler?: Function;
  filter?: Function;
}

export interface TerminalInterface extends BoxInterface {
  handler?: Function;
  shell: string;
  args: string[];
  cursor: any;
  cursorBlink?: boolean;
  screenKeys?: boolean;
  termName: string;
  filter: Function | null;
  term: any; // xterm.js Terminal instance
  pty?: any; // node-pty instance
  title?: string;

  // Terminal control
  write(data: string): any;
  kill(): void;
  destroy(): void;
  screenshot(xi?: number, xl?: number, yi?: number, yl?: number): string;

  // Scrolling (from xterm.js)
  scroll(offset: number): boolean;
  scrollTo(offset: number): boolean;
  resetScroll(): boolean;
  getScroll(): number;
  getScrollHeight(): number;
  getScrollPerc(): number;
  setScrollPerc(percent: number): boolean;
}

// ==============================================
// ProgressBar Interface
// ==============================================

export interface ProgressBarOptions extends BoxOptions {
  orientation?: 'horizontal' | 'vertical';
  filled?: number;
  value?: number;
  pch?: string;
  bch?: string;
  style?: Style & {
    bar?: Style;
  };
}

export interface ProgressBarInterface extends BoxInterface {
  filled: number;
  value: number;

  // Progress control
  setProgress(percent: number): void;
  getProgress(): number;
  progress(percent: number): void;
  reset(): void;
}

// ==============================================
// Log Interface
// ==============================================

export interface LogOptions extends ScrollableBoxOptions {
  scrollback?: number;
  scrollOnInput?: boolean;
}

export interface LogInterface extends ScrollableBoxInterface {
  // Logging
  log(text: string, ...args: any[]): void;
  add(text: string, ...args: any[]): void;
  pushLine(text: string): void;
  popLine(): string;
  getLines(): string[];
  getBaseLine(n: number): string;
  setBaseLine(n: number, line: string): void;
  clearBaseLine(n: number): void;
  insertBaseLine(n: number, line: string): void;
  deleteBaseLine(n: number): string;
  clear(): void;
}

// ==============================================
// FileManager Interface
// ==============================================

export interface FileManagerOptions extends ListOptions {
  cwd?: string;
}

export interface FileManagerInterface extends ListInterface {
  cwd: string;

  // File operations
  refresh(cwd?: string, callback?: Function): void;
  pick(cwd?: string, callback?: Function): void;
  reset(cwd?: string, callback?: Function): void;
}

// ==============================================
// Image Interface
// ==============================================

export interface ImageOptions extends BoxOptions {
  file?: string;
  type?: string;
  width?: number;
  height?: number;
  scale?: number;
  ascii?: boolean;
  optimization?: string;
  speed?: number;
  memory?: number;
  colors?: any;
}

export interface ImageInterface extends BoxInterface {
  file?: string;

  // Image control
  setImage(file: string): void;
  clearImage(): void;
}

// ==============================================
// ANSIImage Interface
// ==============================================

export interface ANSIImageOptions extends ImageOptions {
  // ANSIImage-specific options
}

export interface ANSIImageInterface extends ImageInterface {
  // ANSIImage-specific methods
}

// ==============================================
// OverlayImage Interface
// ==============================================

export interface OverlayImageOptions extends ImageOptions {
  // OverlayImage-specific options
}

export interface OverlayImageInterface extends ImageInterface {
  // OverlayImage-specific methods
}

// ==============================================
// Video Interface
// ==============================================

export interface VideoOptions extends ImageOptions {
  // Video-specific options
}

export interface VideoInterface extends ImageInterface {
  // Video-specific methods
  play(): void;
  pause(): void;
  stop(): void;
}

// ==============================================
// Layout Interface
// ==============================================

export interface LayoutOptions extends ElementOptions {
  layout?: 'grid' | 'inline';
  renderer?: Function;
}

export interface LayoutInterface extends ElementInterface {
  // Layout-specific methods
  render(): any;
  isRendered(el: ElementInterface): boolean;
  getLast(el: ElementInterface): any;
  getLastCoords(el: ElementInterface): any;
}

// ==============================================
// Form Interface
// ==============================================

export interface FormOptions extends BoxOptions {
  keys?: boolean;
  vi?: boolean;
}

export interface FormInterface extends BoxInterface {
  // Form control
  submit(): void;
  cancel(): void;
  reset(): void;

  // Focus management
  focusNext(): ElementInterface;
  focusPrevious(): ElementInterface;
}
