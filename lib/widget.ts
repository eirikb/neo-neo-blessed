/**
 * widget.js - high-level interface for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

// Static imports for bundler compatibility
import node from './widgets/node.js';
import screen from './widgets/screen.js';
import element from './widgets/element.js';
import box from './widgets/box.js';
import text from './widgets/text.js';
import line from './widgets/line.js';
import scrollablebox from './widgets/scrollablebox.js';
import scrollabletext from './widgets/scrollabletext.js';
import bigtext from './widgets/bigtext.js';
import list from './widgets/list.js';
import form from './widgets/form.js';
import input from './widgets/input.js';
import textarea from './widgets/textarea.js';
import textbox from './widgets/textbox.js';
import button from './widgets/button.js';
import progressbar from './widgets/progressbar.js';
import filemanager from './widgets/filemanager.js';
import checkbox from './widgets/checkbox.js';
import radioset from './widgets/radioset.js';
import radiobutton from './widgets/radiobutton.js';
import prompt from './widgets/prompt.js';
import question from './widgets/question.js';
import message from './widgets/message.js';
import loading from './widgets/loading.js';
import listbar from './widgets/listbar.js';
import log from './widgets/log.js';
import table from './widgets/table.js';
import listtable from './widgets/listtable.js';
import terminal from './widgets/terminal.js';
import image from './widgets/image.js';
import ansiimage from './widgets/ansiimage.js';
import overlayimage from './widgets/overlayimage.js';
import video from './widgets/video.js';
import layout from './widgets/layout.js';

const widget = {} as any;

widget.classes = [
  'Node',
  'Screen',
  'Element',
  'Box',
  'Text',
  'Line',
  'ScrollableBox',
  'ScrollableText',
  'BigText',
  'List',
  'Form',
  'Input',
  'Textarea',
  'Textbox',
  'Button',
  'ProgressBar',
  'FileManager',
  'Checkbox',
  'RadioSet',
  'RadioButton',
  'Prompt',
  'Question',
  'Message',
  'Loading',
  'Listbar',
  'Log',
  'Table',
  'ListTable',
  'Terminal',
  'Image',
  'ANSIImage',
  'OverlayImage',
  'Video',
  'Layout',
];

// Static widget mapping for bundler compatibility
const widgetMap = {
  node,
  screen,
  element,
  box,
  text,
  line,
  scrollablebox,
  scrollabletext,
  bigtext,
  list,
  form,
  input,
  textarea,
  textbox,
  button,
  progressbar,
  filemanager,
  checkbox,
  radioset,
  radiobutton,
  prompt,
  question,
  message,
  loading,
  listbar,
  log,
  table,
  listtable,
  terminal,
  image,
  ansiimage,
  overlayimage,
  video,
  layout,
};

widget.classes.forEach(function (name) {
  var file = name.toLowerCase();
  widget[name] = widget[file] = widgetMap[file];
});

widget.aliases = {
  ListBar: 'Listbar',
  PNG: 'ANSIImage',
};

Object.keys(widget.aliases).forEach(function (key) {
  var name = widget.aliases[key];
  widget[key] = widget[name];
  widget[key.toLowerCase()] = widget[name];
});

export default widget;
