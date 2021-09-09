import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import less from 'rollup-plugin-less';

export default [
  {
    input: './src/simpleCodeEditor.ts',
    output: {
      name: 'SimpleCodeEditor',
      sourcemap: true,
      file: './dist/simpleCodeEditor.js',
      format: 'umd'
    },
    plugins: [
      json(),
      resolve(),
      commonjs(),
      typescript(),
      less({
        output: './dist/simpleCodeEditor.css'
      }),
      babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' })
    ]
  }
];
