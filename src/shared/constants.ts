export const classPrefix = 'simple_code_editor';

export const lineHeight = 15;

export const docLeftGap = 5 + 30 + 5;

export const docTopGap = 5;

export const changeOrigin = [
  'cut',
  'undo',
  'paste',
  'input',
  '-delete',
  'delete-',
  'drag',
  'compose',
  'enter'
] as const;

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
  'deleteByDrag'
] as const;

export type InputTypes = typeof inputTypes[number];
