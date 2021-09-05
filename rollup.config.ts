import typescript from '@rollup/plugin-typescript';
import babel from "@rollup/plugin-babel";

function deepClone(input) {
  if (input instanceof Object) {
    if (Array.isArray(input)) {
      const result = [];
      for (const item of input) {
        result.push(deepClone(item));
      }
      return result;
    } else {
      const result = {};
      for (const key of Object.keys(input)) {
        result[key] = deepClone(input[key]);
      }
      return result;
    }
  } else {
    return input;
  }
}

function cloneObjectTo(from, to) {
  if (Array.isArray(from)) {
    to.push(...from);
  } else {
    for (const key of Object.keys(from)) {
      to[key] = from[key];
    }
  }
}

function rollupMerge(...configs) {
  const resultConfig = {};
  for (const config of configs) {
    for (const key of Object.keys(config)) {
      if (key === 'plugins') {
        resultConfig[key] = config[key];
        continue;
      }
      const currentValue = resultConfig[key];
      if (currentValue instanceof Object) {
        cloneObjectTo(deepClone(config[key]), resultConfig[key]);
      } else {
        resultConfig[key] = deepClone(config[key]);
      }
    }
  }
  return resultConfig;
}

const commonConfig = {
  input: './src/simpleCodeEditor.ts',
  output: {
    name: 'SimpleCodeEditor',
    sourcemap: true
  },
  plugins: [
    babel({ babelHelpers: "bundled" }),
    typescript()
  ]
}

const cjsConfig = {
  output: {
    file: './lib/simpleCodeEditor.cjs.js',
    format: 'cjs'
  },
}

const umdConfig = {
  output: {
    file: './dist/simpleCodeEditor.js',
    format: 'umd'
  },
}

export default [
  rollupMerge(commonConfig, cjsConfig),
  rollupMerge(commonConfig, umdConfig)
];