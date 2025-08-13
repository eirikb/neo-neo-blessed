/**
 * Type definitions for neo-neo-blessed
 */

declare module 'neo-neo-blessed' {
  export interface BlessedOptions {
    parent?: any;
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
    width?: number | string;
    height?: number | string;
    content?: string;
    tags?: boolean;
    border?: string | object;
    style?: object;
    scrollable?: boolean;
    mouse?: boolean;
    keys?: boolean;
    vi?: boolean;
    [key: string]: any;
  }

  export interface BlessedElement {
    focus(): void;
    blur(): void;
    destroy(): void;
    show(): void;
    hide(): void;
    setContent(content: string): void;
    getContent(): string;
    insertLine(i: number, line: string): void;
    deleteLine(i: number): void;
    setLine(i: number, line: string): void;
    render(): void;
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    emit(event: string, ...args: any[]): boolean;
    [key: string]: any;
  }

  export interface BlessedScreen extends BlessedElement {
    program: any;
    render(): void;
    destroy(): void;
    saveFocus(): void;
    restoreFocus(): void;
    focusNext(): void;
    focusPrevious(): void;
    append(element: BlessedElement): void;
    remove(element: BlessedElement): void;
    key(keys: string | string[], handler: Function): void;
  }

  export function screen(options?: BlessedOptions): BlessedScreen;
  export function box(options?: BlessedOptions): BlessedElement;
  export function text(options?: BlessedOptions): BlessedElement;
  export function button(options?: BlessedOptions): BlessedElement;
  export function list(options?: BlessedOptions): BlessedElement;
  export function form(options?: BlessedOptions): BlessedElement;
  export function input(options?: BlessedOptions): BlessedElement;
  export function textarea(options?: BlessedOptions): BlessedElement;
  export function textbox(options?: BlessedOptions): BlessedElement;
  export function checkbox(options?: BlessedOptions): BlessedElement;
  export function radioset(options?: BlessedOptions): BlessedElement;
  export function radiobutton(options?: BlessedOptions): BlessedElement;
  export function progressbar(options?: BlessedOptions): BlessedElement;
  export function table(options?: BlessedOptions): BlessedElement;
  export function listtable(options?: BlessedOptions): BlessedElement;
  export function terminal(options?: BlessedOptions): BlessedElement;
  export function image(options?: BlessedOptions): BlessedElement;
  export function video(options?: BlessedOptions): BlessedElement;
  export function loading(options?: BlessedOptions): BlessedElement;
  export function prompt(options?: BlessedOptions): BlessedElement;
  export function question(options?: BlessedOptions): BlessedElement;
  export function message(options?: BlessedOptions): BlessedElement;
  export function listbar(options?: BlessedOptions): BlessedElement;
  export function log(options?: BlessedOptions): BlessedElement;
  export function bigtext(options?: BlessedOptions): BlessedElement;
  export function layout(options?: BlessedOptions): BlessedElement;
  export function line(options?: BlessedOptions): BlessedElement;
  export function scrollablebox(options?: BlessedOptions): BlessedElement;
  export function scrollabletext(options?: BlessedOptions): BlessedElement;
  export function filemanager(options?: BlessedOptions): BlessedElement;

  // Widget classes
  export const widget: {
    Node: any;
    Screen: any;
    Element: any;
    Box: any;
    Text: any;
    Line: any;
    ScrollableBox: any;
    ScrollableText: any;
    BigText: any;
    List: any;
    Form: any;
    Input: any;
    Textarea: any;
    Textbox: any;
    Button: any;
    ProgressBar: any;
    FileManager: any;
    Checkbox: any;
    RadioSet: any;
    RadioButton: any;
    Prompt: any;
    Question: any;
    Message: any;
    Loading: any;
    Listbar: any;
    Log: any;
    Table: any;
    ListTable: any;
    Terminal: any;
    Image: any;
    ANSIImage: any;
    OverlayImage: any;
    Video: any;
    Layout: any;
  };

  // Helper functions
  export const helpers: {
    merge(a: any, b: any): any;
    asort(obj: any[]): any[];
    hsort(obj: any[]): any[];
    findFile(start: string, target: string): string | null;
    escape(text: string): string;
    parseTags(text: string, screen?: any): string;
    generateTags(style: object, text?: string): any;
    stripTags(text: string): string;
    cleanTags(text: string): string;
    dropUnicode(text: string): string;
  };

  // Colors and unicode utilities
  export const colors: any;
  export const unicode: any;
  export const program: any;
  export const tput: any;
}
