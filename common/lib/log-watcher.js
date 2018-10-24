'use strict';

const fs = require('fs');

const LEVELS = [
  'error',
  'warn',
  'info',
  'debug'
];

//LOG_LEVEL:  level,[debug_modules]
module.exports = function(path, mounts) {
  fs.watch(path, {encoding: 'utf8'}, (event)=>{
    fs.readFile(path, {encoding: 'utf8'}, (err, data)=>{
      if (err) return console.log(err);

      data = data.split(/[\s,]+/);
      let level = (''+data[0]).trim();
      let namespaces = enabled(data.slice(1));
      if (LEVELS.indexOf(level)) {
        mounts.map(mountPoint=>{
          mountPoint.LOG_LEVEL = level;
          mountPoint.DEBUG_MODULES = namespaces;
        });
        console.log('SET LOG_LEVEL: ', level);
      }
    });
  });
}

function enabled(namespaces) {
  let pattern = [];
  namespaces.forEach(namespace=>{
    namespace = namespace.replace(/\*/g, '.*?');
    if (namespace) {
      return pattern.push(new RegExp('^'+namespace+'$'));
    }
  });
  return pattern;
}
