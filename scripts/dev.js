const path = require('path');
const execa = require('execa');
const rimraf = require('rimraf');

rimraf.sync(path.resolve(__dirname, 'dist'));

// concurrently \"rollup -c -w\" \"live-server --port=8099 --watch=demo,src,dist --open=demo\"
execa('concurrently', ['rollup -c -w', 'live-server --port=8999 --watch=demo,src,dist --open=demo'], {
  stdio: 'inherit'
});
