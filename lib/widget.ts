/**
 * widget.js - high-level interface for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

// Static imports for bundler compatibility
import node from './widgets/node';
import screen from './widgets/screen';
import element from './widgets/element';
import box from './widgets/box';
import text from './widgets/text';
import line from './widgets/line';
import scrollablebox from './widgets/scrollablebox';
import scrollabletext from './widgets/scrollabletext';
import bigtext from './widgets/bigtext';
import list from './widgets/list';
import form from './widgets/form';
import input from './widgets/input';
import textarea from './widgets/textarea';
import textbox from './widgets/textbox';
import button from './widgets/button';
import progressbar from './widgets/progressbar';
import filemanager from './widgets/filemanager';
import checkbox from './widgets/checkbox';
import radioset from './widgets/radioset';
import radiobutton from './widgets/radiobutton';
import prompt from './widgets/prompt';
import question from './widgets/question';
import message from './widgets/message';
import loading from './widgets/loading';
import listbar from './widgets/listbar';
import log from './widgets/log';
import table from './widgets/table';
import listtable from './widgets/listtable';
import terminal from './widgets/terminal';
import image from './widgets/image';
import ansiimage from './widgets/ansiimage';
import overlayimage from './widgets/overlayimage';
import video from './widgets/video';
import layout from './widgets/layout';

var widget = exports;

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
