export const classPrefix = 'simple_code_editor';

export const lineHeight = 15;

export const inputTypes = [
  'insertText',
  'insertFromPaste',
  'insertCompositionText',
  'insertFromDrop',
  'deleteContentBackward',
  'deleteByCut',
  'deleteByDrag',
  'insertLineBreak'
] as const;

export const changeOrigin = ['cut', 'undo', 'paste', 'input', 'delete', 'drag', 'compose'] as const;

export const docLeftGap = 5 + 30 + 5;

export const docTopGap = 5;
