/**
 * Type definitions for neo-neo-blessed
 *
 * Neo-neo-blessed is a high-level terminal interface library for Node.js.
 * It provides a rich set of widgets for creating text-based user interfaces.
 *
 * @author Christopher Jeffrey, Iuri Matias, Eirik Brandtzæg
 * @license MIT
 * @version 0.0.0-development
 */

declare module 'neo-neo-blessed' {
  import { EventEmitter } from 'events';
  import { Stream } from 'stream';

  // Re-export main namespace
  export = blessed;

  namespace blessed {
    // Widget creation functions

    /**
     * Create a new screen instance.
     * The screen acts as the root container for all other widgets.
     *
     * @param options - Configuration options for the screen
     * @returns A new screen instance
     *
     * @example
     * ```typescript
     * const screen = blessed.screen({
     *   smartCSR: true,
     *   cursor: {
     *     artificial: true,
     *     shape: 'line',
     *     blink: true,
     *     color: null
     *   }
     * });
     * ```
     */
    export function screen(options?: ScreenOptions): ScreenInterface;

    /**
     * Create a basic box widget.
     * Boxes are the building blocks of most other widgets.
     *
     * @param options - Configuration options for the box
     * @returns A new box instance
     */
    export function box(options?: BoxOptions): BoxInterface;

    /**
     * Create a text widget for displaying static text content.
     *
     * @param options - Configuration options for the text
     * @returns A new text instance
     */
    export function text(options?: TextOptions): TextInterface;

    /**
     * Create a line widget for drawing horizontal or vertical lines.
     *
     * @param options - Configuration options for the line
     * @returns A new line instance
     */
    export function line(options?: LineOptions): LineInterface;

    /**
     * Create a scrollable box widget with scroll support.
     *
     * @param options - Configuration options for the scrollable box
     * @returns A new scrollable box instance
     */
    export function scrollablebox(
      options?: ScrollableBoxOptions
    ): ScrollableBoxInterface;
    export function scrollabletext(
      options?: ScrollableTextOptions
    ): ScrollableTextInterface;
    export function bigtext(options?: BigTextOptions): BigTextInterface;

    /**
     * Create a list widget for displaying selectable items.
     *
     * @param options - Configuration options for the list
     * @returns A new list instance
     *
     * @example
     * ```typescript
     * const list = blessed.list({
     *   parent: screen,
     *   top: 'center',
     *   left: 'center',
     *   width: '50%',
     *   height: '50%',
     *   items: ['Item 1', 'Item 2', 'Item 3'],
     *   keys: true,
     *   vi: true,
     *   mouse: true,
     *   style: {
     *     selected: {
     *       bg: 'blue'
     *     }
     *   }
     * });
     * ```
     */
    export function list(options?: ListOptions): ListInterface;

    /**
     * Create a file manager widget for browsing directories.
     *
     * @param options - Configuration options for the file manager
     * @returns A new file manager instance
     */
    export function filemanager(
      options?: FileManagerOptions
    ): FileManagerInterface;

    /**
     * Create a textarea widget for multi-line text input.
     *
     * @param options - Configuration options for the textarea
     * @returns A new textarea instance
     *
     * @example
     * ```typescript
     * const textarea = blessed.textarea({
     *   parent: screen,
     *   top: 'center',
     *   left: 'center',
     *   width: '80%',
     *   height: '60%',
     *   border: 'line',
     *   style: {
     *     fg: 'white',
     *     bg: 'blue'
     *   },
     *   keys: true,
     *   mouse: true
     * });
     * ```
     */
    export function textarea(options?: TextareaOptions): TextareaInterface;
    export function textbox(options?: TextboxOptions): TextboxInterface;
    export function button(options?: ButtonOptions): ButtonInterface;
    export function progressbar(
      options?: ProgressBarOptions
    ): ProgressBarInterface;
    export function input(options?: InputOptions): InputInterface;
    export function form(options?: FormOptions): FormInterface;
    export function prompt(options?: PromptOptions): PromptInterface;
    export function question(options?: QuestionOptions): QuestionInterface;
    export function message(options?: MessageOptions): MessageInterface;
    export function loading(options?: LoadingOptions): LoadingInterface;
    export function listbar(options?: ListbarOptions): ListbarInterface;
    export function log(options?: LogOptions): LogInterface;
    export function table(options?: TableOptions): TableInterface;
    export function listtable(options?: ListTableOptions): ListTableInterface;
    export function terminal(options?: TerminalOptions): TerminalInterface;
    export function image(options?: ImageOptions): ImageInterface;
    export function ansiimage(options?: ANSIImageOptions): ANSIImageInterface;
    export function overlayimage(
      options?: OverlayImageOptions
    ): OverlayImageInterface;
    export function video(options?: VideoOptions): VideoInterface;
    export function layout(options?: LayoutOptions): LayoutInterface;

    // Core classes
    export function program(options?: ProgramOptions): ProgramInterface;
    export const colors: ColorModule;
    export const unicode: any;
    export const escape: any;

    // Node interfaces
    interface NodeOptions {
      screen?: any;
      parent?: NodeInterface;
      children?: NodeInterface[];
      [key: string]: any;
    }

    interface NodeInterface extends EventEmitter {
      type: string;
      options: NodeOptions;
      screen: any;
      parent: NodeInterface | null;
      children: NodeInterface[];
      data: { [key: string]: any };
      $: { [key: string]: any };
      _: { [key: string]: any };
      uid: number;
      index: number;
      detached: boolean;

      insert(element: NodeInterface, i: number): void;
      prepend(element: NodeInterface): void;
      append(element: NodeInterface): void;
      insertBefore(element: NodeInterface, other: NodeInterface): void;
      insertAfter(element: NodeInterface, other: NodeInterface): void;
      remove(element: NodeInterface): void;
      detach(): void;
      destroy(): void;
    }

    // Element interfaces
    interface ElementOptions extends NodeOptions {
      top?: number | string;
      left?: number | string;
      right?: number | string;
      bottom?: number | string;
      width?: number | string;
      height?: number | string;
      content?: string;
      tags?: boolean;
      hidden?: boolean;
      visible?: boolean;
      style?: any;
      border?: any;
      padding?: any;
      margin?: any;
      scrollable?: boolean;
      clickable?: boolean;
      keyable?: boolean;
      focused?: boolean;
      mouse?: boolean;
      keys?: boolean;
      vi?: boolean;
    }

    interface ElementInterface extends NodeInterface {
      content: string;
      hidden: boolean;
      visible: boolean;
      aleft: number;
      aright: number;
      atop: number;
      abottom: number;
      width: number;
      height: number;

      hide(): void;
      show(): void;
      toggle(): void;
      focus(): void;
      blur(): void;
      render(): void;
      setContent(content: string): void;
      getContent(): string;
      clearPos(): void;
      setLabel(label: string): void;
    }

    // Screen interfaces
    interface ScreenOptions extends ElementOptions {
      program?: ProgramInterface;
      smartCSR?: boolean;
      useBCE?: boolean;
      cursor?: any;
      terminal?: string;
      fullUnicode?: boolean;
      dockBorders?: boolean;
      ignoreDockContrast?: boolean;
      resizeTimeout?: number;
      title?: string;
      warnings?: boolean;
    }

    interface ScreenInterface extends ElementInterface {
      program: ProgramInterface;
      tput: any;
      focused: ElementInterface;
      width: number;
      height: number;
      cols: number;
      rows: number;

      log(...args: any[]): void;
      debug(...args: any[]): void;
      render(): void;
      rewindFocus(): void;
      focusNext(): void;
      focusPrevious(): void;
      clearRegion(x1: number, x2: number, y1: number, y2: number): void;
      fillRegion(
        attr: any,
        ch: string,
        x1: number,
        x2: number,
        y1: number,
        y2: number
      ): void;
      key(keys: string | string[], callback: Function): void;
      onceKey(keys: string | string[], callback: Function): void;
      unkey(keys: string | string[], callback: Function): void;
      spawn(file: string, args: string[], options: any): any;
      destroy(): void;
    }

    // Box interfaces
    interface BoxOptions extends ElementOptions {
      bindings?: any;
    }

    interface BoxInterface extends ElementInterface {
      type: 'box';
    }

    // Text interfaces
    interface TextOptions extends ElementOptions {
      fill?: boolean;
      align?: 'left' | 'center' | 'right';
    }

    interface TextInterface extends ElementInterface {
      type: 'text';
    }

    // List interfaces
    interface ListOptions extends BoxOptions {
      items?: string[];
      selected?: number;
      interactive?: boolean;
      mouse?: boolean;
      keys?: boolean;
      vi?: boolean;
      invertSelected?: boolean;
      scrollbar?: any;
      style?: {
        selected?: any;
        item?: any;
        scrollbar?: any;
      };
    }

    interface ListInterface extends BoxInterface {
      type: 'list';
      items: string[];
      selected: number;

      add(item: string): void;
      addItem(item: string): void;
      removeItem(item: string): void;
      pushItem(item: string): void;
      popItem(): string | undefined;
      unshiftItem(item: string): void;
      shiftItem(): string | undefined;
      insertItem(i: number, item: string): void;
      setItem(i: number, item: string): void;
      spliceItem(i: number, n: number, ...items: string[]): void;
      clearItems(): void;
      setItems(items: string[]): void;
      select(i: number): void;
      up(amount?: number): void;
      down(amount?: number): void;
      pick(callback: (err: any, value: string) => void): void;
      fuzzyFind(search?: string): void;
    }

    // Terminal interfaces
    interface TerminalOptions extends BoxOptions {
      handler?: Function;
      shell?: string;
      args?: string[];
      cursor?: any;
      cursorBlink?: boolean;
      screenKeys?: boolean;
      terminal?: string;
      env?: { [key: string]: string };
    }

    interface TerminalInterface extends BoxInterface {
      type: 'terminal';
      term: any;
      pty?: any;

      write(data: string): void;
      screenshot(xi?: number, xl?: number, yi?: number, yl?: number): string;
      kill(): void;
    }

    // Form interfaces
    interface FormOptions extends BoxOptions {
      keys?: boolean;
      vi?: boolean;
    }

    interface FormInterface extends BoxInterface {
      type: 'form';
      submission: { [key: string]: any };

      focus(): void;
      submit(): void;
      cancel(): void;
      reset(): void;
    }

    // Textarea interfaces
    interface TextareaOptions extends ScrollableTextOptions {
      inputOnFocus?: boolean;
      completer?: Function;
    }

    interface TextareaInterface extends ScrollableTextInterface {
      type: 'textarea';
      value: string;

      clearValue(): void;
      setValue(value: string): void;
      getValue(): string;
      readInput(callback?: (err: any, value: string) => void): void;
      readEditor(callback?: (err: any, value: string) => void): void;
      cancel(): void;
      submit(): void;
    }

    // Table interfaces
    interface TableOptions extends BoxOptions {
      rows?: string[][];
      data?: string[][];
      pad?: number;
      noCellBorders?: boolean;
      fillCellBorders?: boolean;
      style?: {
        header?: any;
        cell?: any;
        border?: any;
      };
    }

    interface TableInterface extends BoxInterface {
      type: 'table';
      rows: string[][];

      setData(data: string[][]): void;
      setRows(rows: string[][]): void;
    }

    // Additional widget interfaces...
    interface LineOptions extends BoxOptions {
      orientation?: 'horizontal' | 'vertical';
      ch?: string;
    }

    interface LineInterface extends BoxInterface {
      type: 'line';
    }

    interface ScrollableBoxOptions extends BoxOptions {
      baseLimit?: number;
      alwaysScroll?: boolean;
      scrollbar?: {
        ch?: string;
        track?: any;
        style?: any;
        inverse?: boolean;
      };
    }

    interface ScrollableBoxInterface extends BoxInterface {
      type: 'scrollable-box';
      childBase: number;
      childOffset: number;

      scroll(offset: number): void;
      scrollTo(index: number): void;
      setScroll(index: number): void;
      setScrollPerc(percent: number): void;
      getScroll(): number;
      getScrollHeight(): number;
      getScrollPerc(): number;
      resetScroll(): void;
    }

    interface ScrollableTextOptions extends ScrollableBoxOptions {
      mouse?: boolean;
      keys?: boolean;
      vi?: boolean;
    }

    interface ScrollableTextInterface extends ScrollableBoxInterface {
      type: 'scrollable-text';
    }

    interface BigTextOptions extends BoxOptions {
      font?: string;
      fontBold?: string;
      fch?: string;
    }

    interface BigTextInterface extends BoxInterface {
      type: 'big-text';
    }

    interface FileManagerOptions extends ListOptions {
      cwd?: string;
    }

    interface FileManagerInterface extends ListInterface {
      type: 'file-manager';
      cwd: string;

      refresh(cwd?: string, callback?: Function): void;
      pick(cwd?: string, callback?: Function): void;
      reset(cwd?: string, callback?: Function): void;
    }

    interface TextboxOptions extends TextareaOptions {
      secret?: boolean;
      censor?: boolean;
    }

    interface TextboxInterface extends TextareaInterface {
      type: 'textbox';
    }

    interface ButtonOptions extends BoxOptions {
      name?: string;
    }

    interface ButtonInterface extends BoxInterface {
      type: 'button';

      press(): void;
    }

    interface ProgressBarOptions extends BoxOptions {
      orientation?: 'horizontal' | 'vertical';
      pch?: string;
      filled?: number;
      ch?: string;
    }

    interface ProgressBarInterface extends BoxInterface {
      type: 'progress-bar';
      filled: number;

      progress(amount: number): void;
      setProgress(percent: number): void;
      reset(): void;
    }

    interface InputOptions extends BoxOptions {
      name?: string;
      value?: string;
      defaultValue?: string;
    }

    interface InputInterface extends BoxInterface {
      type: 'input';
    }

    interface PromptOptions extends BoxOptions {
      name?: string;
      value?: string;
    }

    interface PromptInterface extends BoxInterface {
      type: 'prompt';

      input(
        text: string,
        value: string,
        callback: (err: any, value: string) => void
      ): void;
      setInput(
        text: string,
        value: string,
        callback: (err: any, value: string) => void
      ): void;
      readInput(
        text: string,
        value: string,
        callback: (err: any, value: string) => void
      ): void;
    }

    interface QuestionOptions extends BoxOptions {
      name?: string;
    }

    interface QuestionInterface extends BoxInterface {
      type: 'question';

      ask(text: string, callback: (err: any, value: string) => void): void;
    }

    interface MessageOptions extends BoxOptions {
      name?: string;
    }

    interface MessageInterface extends BoxInterface {
      type: 'message';

      log(text: string, time?: number, callback?: Function): void;
      error(text: string, time?: number, callback?: Function): void;
      display(text: string, time?: number, callback?: Function): void;
    }

    interface LoadingOptions extends BoxOptions {
      name?: string;
    }

    interface LoadingInterface extends BoxInterface {
      type: 'loading';

      load(text: string): void;
      stop(): void;
    }

    interface ListbarOptions extends BoxOptions {
      commands?: any;
      items?: any;
    }

    interface ListbarInterface extends BoxInterface {
      type: 'listbar';

      setItems(items: any): void;
      selectTab(i: number): void;
      removeTab(i: number): void;
      addItem(item: any): void;
    }

    interface LogOptions extends ScrollableTextOptions {
      bufferLength?: number;
    }

    interface LogInterface extends ScrollableTextInterface {
      type: 'log';

      log(...args: any[]): void;
      add(...args: any[]): void;
    }

    interface ListTableOptions extends ListOptions {
      rows?: any[];
      data?: any[];
      pad?: number;
      noCellBorders?: boolean;
      style?: {
        header?: any;
        cell?: any;
        selected?: any;
      };
    }

    interface ListTableInterface extends ListInterface {
      type: 'list-table';
      rows: any[];

      setData(data: any[]): void;
      setRows(rows: any[]): void;
    }

    interface ImageOptions extends BoxOptions {
      type?: 'ansi' | 'overlay';
      w3m?: boolean;
      search?: boolean;
    }

    interface ImageInterface extends BoxInterface {
      type: 'image';
    }

    interface ANSIImageOptions extends BoxOptions {
      file?: string;
      scale?: number;
      width?: number | string;
      height?: number | string;
      ascii?: boolean;
      animate?: boolean;
      speed?: number;
      optimization?: string;
    }

    interface ANSIImageInterface extends BoxInterface {
      type: 'ansiimage';

      setImage(file: string): void;
      clearImage(): void;
      play(): void;
      pause(): void;
      stop(): void;
    }

    interface OverlayImageOptions extends BoxOptions {
      file?: string;
      w3m?: boolean;
      search?: boolean;
      left?: number;
      top?: number;
      width?: number;
      height?: number;
    }

    interface OverlayImageInterface extends BoxInterface {
      type: 'overlayimage';

      setImage(file: string, callback?: Function): void;
      clearImage(callback?: Function): void;
      imageSize(file: string, callback?: Function): void;
      termSize(callback?: Function): void;
      getPixelRatio(callback?: Function): void;
    }

    interface VideoOptions extends BoxOptions {
      file?: string;
      start?: number;
    }

    interface VideoInterface extends BoxInterface {
      type: 'video';
      tty: string;

      start(): void;
      stop(): void;
      pause(): void;
      resume(): void;
    }

    interface LayoutOptions extends ElementOptions {
      renderer?: any;
      layout?: 'inline' | 'inline-block' | 'block' | 'grid';
    }

    interface LayoutInterface extends ElementInterface {
      type: 'layout';

      isRendered(el: ElementInterface): boolean;
      getLast(i: number): ElementInterface;
      getLastCoords(i: number): any;
      _renderCoords(): any;
    }

    // Program interfaces
    interface ProgramOptions {
      input?: Stream;
      output?: Stream;
      log?: string;
      dump?: boolean;
      zero?: boolean;
      buffer?: boolean;
      terminal?: string;
      term?: string;
      tput?: boolean;
      debug?: boolean;
      resizeTimeout?: number;
    }

    interface ProgramInterface extends EventEmitter {
      type: 'program';
      options: ProgramOptions;
      input: Stream;
      output: Stream;
      zero: boolean;
      useBuffer: boolean;
      x: number;
      y: number;
      cols: number;
      rows: number;
      terminal: string;

      listen(): void;
      destroy(): void;
      write(text: string): boolean;
      flush(): void;
      clear(): void;
      reset(): void;

      // Terminal capabilities
      alternateBuffer(): boolean;
      hideCursor(): boolean;
      showCursor(): boolean;
      cursorShape(shape: string, blink?: boolean): boolean;
      move(x: number, y: number): boolean;

      // Colors
      fg(color: string | number, val?: string): string;
      bg(color: string | number, val?: string): string;

      // Mouse
      enableMouse(): void;
      disableMouse(): void;

      // Keys
      key(keys: string | string[], callback: Function): void;
      onceKey(keys: string | string[], callback: Function): void;
      removeKey(keys: string | string[], callback: Function): void;

      // Misc
      log(...args: any[]): void;
      debug(...args: any[]): void;
    }

    // Color module
    interface ColorModule {
      match(r: number | string | number[], g?: number, b?: number): number;
      RGBToHex(r: number | number[], g?: number, b?: number): string;
      hexToRGB(hex: string): number[];
      mixColors(c1: number, c2: number, alpha?: number): number;
      blend(attr: number, attr2?: number, alpha?: number): number;
      reduce(color: number, total: number): number;
      convert(color: string | number | number[]): number;
    }

    // Helper types
    type CursorShape = 'block' | 'underline' | 'line';
    type MouseAction =
      | 'mousedown'
      | 'mouseup'
      | 'mousemove'
      | 'wheeldown'
      | 'wheelup';
  }
}
