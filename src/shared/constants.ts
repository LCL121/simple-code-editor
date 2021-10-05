export const classPrefix = 'simple_code_editor';

export const lineHeight = 15;

export const docLeftGap = 5 + 30 + 5;

export const docTopGap = 5;

// compose 合并特殊
export const mergeOps = ['-delete', 'delete-', 'input'] as const;

export const changeOrigin = [...mergeOps, 'compose', 'cut', 'undo', 'redo', 'paste', 'drag', 'enter', 'tab'] as const;

export type ChangeOrigin = typeof changeOrigin[number];

export const keyboardMap = {
  Enter: 'enter',
  ArrowUp: 'up',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  Backspace: '-delete',
  Delete: 'delete-',
  Home: 'start',
  End: 'end',
  Tab: 'tab'
};

export const keyboardMapKeys = Object.keys(keyboardMap);

export type KeyboardMapKeys = keyof typeof keyboardMap;

export const inputTypes = [
  'insertText',
  'insertFromPaste',
  'insertCompositionText',
  'insertFromDrop',
  'deleteByCut',
  'deleteByDrag',
  'deleteContentBackward' // 处理composition input 兼容
] as const;

export type InputTypes = typeof inputTypes[number];

export const shortcutMap = {
  ctrl_a: 'selectedAll' as const,
  ctrl_z: 'undo' as const,
  ctrl_y: 'redo' as const,
  shift_Tab: 'reTab' as const
};

export const shortcutMapKeys = Object.keys(shortcutMap);

// #region userAgent
const _userAgent = navigator.userAgent;
const _platform = navigator.platform;

const gecko = /gecko\/\d/i.test(_userAgent);
const edge = /Edge\/(\d+)/.exec(_userAgent);
const chrome = !edge && /Chrome\//.test(_userAgent);
// 与code mirror 有所不同
const webkit = /WebKit\//.test(_userAgent);
const safari = /Apple Computer/.test(navigator.vendor);
const presto = /Opera\//.test(_userAgent);

const ios = safari && (/Mobile\/\w+/.test(_userAgent) || navigator.maxTouchPoints > 2);
const android = /Android/.test(_userAgent);
const mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(_userAgent);
const mac = ios || /Mac/.test(_platform);
const windows = /win/i.test(_platform);
const chromeOS = /\bCrOS\b/.test(_userAgent);

export const userAgent = {
  gecko,
  edge,
  chrome,
  webkit,
  safari,
  presto,

  ios,
  android,
  mobile,
  mac,
  windows,
  chromeOS
};

// #endregion
