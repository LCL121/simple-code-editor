const path = require('path');
const execa = require('execa');
const rimraf = require('rimraf');

rimraf.sync(path.resolve(__dirname, 'dist'));

execa('rollup', ['-c'], {
  stdio: 'inherit'
});
