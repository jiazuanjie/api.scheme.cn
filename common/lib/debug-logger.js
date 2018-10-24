'use strict';

let bunyan = require('bunyan');

class DebuggerLogger {
  constructor(name){
    this.logger = bunyan.createLogger({
      name: name,
      stream: process.stdout,
      level: 'info'
    });
    this.name = name;
    return this.debug.bind(this);
  }

  debug() {
    let enabled = false;
    if (!global.DEBUG_MODULES || !global.DEBUG_MODULES.length) {
      enabled = false;
      return;
    }

    global.DEBUG_MODULES.forEach(namespace=>{
      return namespace.test(this.name) && (enabled = true);
    });

    if (global.LOG_LEVEL != 'debug' && this.logger.level() === 'debug') {
      global.LOG_LEVEL = 'info';
    } else if (global.LOG_LEVEL === 'debug' && this.logger.level() != 'debug') {
      global.LOG_LEVEL = 'debug';
    }
    this.logger.level(global.LOG_LEVEL);
    enabled && this.logger.debug.apply(this.logger, arguments);
  }

}

module.exports = (name)=> new DebuggerLogger(name);

