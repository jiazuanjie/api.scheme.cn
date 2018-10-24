'use strict';
let _redis  = require('redis');
let wrapper = require('co-redis');
let bunyan  = require('bunyan');
let logger  = bunyan.createLogger({name: 'redis'});

const redis = module.exports = function (config) {
  config = config && typeof(config) === 'object' ? config : {};
  this.config = config;
  this.conn = null;
}

//创建redis连接对象
//globalName:全局对象名称
redis.prototype.createConn = function (globalName) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    let client = _redis.createClient(_this.config);
    client.on("error", function (err) {
      logger.error('%s连接出错', globalName);
      reject(err);
    });
    client.on('connect', function () {
      logger.debug('开始连接%s', globalName);
    });
    client.on('ready', function () {
      logger.debug('%s连接成功', globalName);
      _this.conn = wrapper(client);
      if (globalName) {
        _this.conn.globalName = globalName;
        global[globalName] = _this.conn;
      }
      resolve(true);
    });
    client.on('reconnecting', function () {
      logger.warn('开始重新连接%s...', globalName);
    });
  })
}


