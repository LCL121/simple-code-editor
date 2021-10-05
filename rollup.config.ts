import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import minimist from 'minimist';
import { terser } from 'rollup-plugin-terser';

// 获取命令行参数
const args = minimist(process.argv.slice(2));

const umdConfig = {
  input: './src/simpleCodeEditor.ts',
  output: {
    name: 'SimpleCodeEditor',
    sourcemap: true,
    file: './dist/simpleCodeEditor.js',
    format: 'umd'
  },
  plugins: [json(), resolve(), commonjs(), typescript(), babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' })]
};

if (args.env === 'build') {
  umdConfig.plugins.push(
    terser({ compress: { drop_console: true, drop_debugger: true }, output: { comments: false } })
  );
  umdConfig.output.file = './dist/simpleCodeEditor.min.js';
}

export default [umdConfig];
