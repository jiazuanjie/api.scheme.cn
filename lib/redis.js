'use strict';
let co = require('co');
let _redis = require('redis');
let wrapper = require('co-redis');
let mconfig = require('../config/main');
let debug = require('debug')('lib:redis');

const redis = module.exports = function (config) {
  config = config && typeof(config) === 'object' ? config : {};
  this.config = Object.assign({}, mconfig.redis, config);
  this.conn = null;
}

//创建redis连接对象
//globalName:全局对象名称
redis.prototype.createConn = function (globalName) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    let client = _redis.createClient(_this.config);
    client.on("error", function (err) {
      debug('%s连接出错'.red, globalName);
      reject(err);
    });
    client.on('connect', function () {
      debug('开始连接%s'.yellow, globalName);
    });
    client.on('ready', function () {
      debug('%s连接成功'.green, globalName);
      _this.conn = wrapper(client);
      if (globalName) {
        _this.conn.globalName = globalName;
        global[globalName] = _this.conn;
      }
      resolve(true);
    });
    client.on('reconnecting', function () {
      debug('开始重新连接%s...'.yellow, globalName);
    });
  })
}
