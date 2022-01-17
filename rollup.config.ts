import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import minimist from 'minimist';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

// 获取命令行参数
const args = minimist(process.argv.slice(2));

const input = './src/simpleCodeEditor.ts';
const plugins = [
  json(),
  resolve(),
  commonjs(),
  typescript(),
  babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' })
];

const umdConfig = {
  input,
  output: {
    name: 'SimpleCodeEditor',
    sourcemap: true,
    file: './dist/simpleCodeEditor.js',
    format: 'umd'
  },
  plugins
};

const esmConfig = {
  input,
  output: {
    name: 'SimpleCodeEditor',
    sourcemap: true,
    file: './dist/simpleCodeEditor.esm.js',
    format: 'es'
  },
  plugins
};

if (args.env === 'build') {
  umdConfig.plugins.push(
    terser({ compress: { drop_console: true, drop_debugger: true }, output: { comments: false } })
  );
  umdConfig.output.file = './dist/simpleCodeEditor.min.js';

  esmConfig.plugins.push(
    terser({ compress: { drop_console: true, drop_debugger: true }, output: { comments: false } })
  );
  esmConfig.output.file = './dist/simpleCodeEditor.esm.min.js';
}

export default [
  umdConfig,
  esmConfig,
  {
    input: './dist/simpleCodeEditor.d.ts',
    output: [{ file: 'dist/simpleCodeEditor.d.ts', format: 'es' }],
    plugins: [dts()]
  }
];
