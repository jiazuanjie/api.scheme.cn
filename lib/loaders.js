const fs = require('fs');
const path = require('path');

exports.loadModules = function loadModules(dirname) {
  return fs.readdirSync(dirname).filter(module => /.js$/.test(module)).map(module => path.join(dirname, module));
}