'use strict';
let mysql = require('../lib/mysql');
let redis = require('../lib/redis');
let debug = require('debug')('conn');

//连接mysql
exports.mysql = function (name, config) {
  name = typeof(name) === 'string' ? name : 'mdb';
  config = config && typeof(config) === 'object' ? config : null;
  return new mysql(config).createConn(name);
}

//连接redis
exports.redis = function (name, config) {
  name = name ? name : 'redis';
  config = config && typeof(config) === 'object' ? config : null;
  return new redis(config).createConn(name);
}

//连接mysql和redis
exports.main = function () {
  return new mysql().createConn('mdb').then(function () {
    return new redis().createConn('redis');
  })
}

//检查redis状态,无效返回一个错误
exports.checkRedis = function (name) {
  name = name ? name : 'redis';
  if (!global[name]) return Promise.reject(new Error('尚未初始化global.' + name + '对象'));
  return new Promise(function (resolve, reject) {
    let timeout = setTimeout(function () {
      reject(new Error(name + '请求超时'));
    }, 3000);
    global[name].get('test').then(function () {
      clearTimeout(timeout);
      resolve(true);
    }, function (err) {
      clearTimeout(timeout);
      reject(err);
    });
  })
}

//检查mdb状态,无效返回一个错误
exports.checkMysql = function (name) {
  name = name ? name : 'mdb';
  if (!global[name]) return Promise.reject(new Error('尚未初始化global.' + name + '对象'));
  return new Promise(function (resolve, reject) {
    let timeout = setTimeout(function () {
      reject(new Error(name + '请求超时'));
    }, 3000);
    global[name].query('select id from usho_version where id=1', [], function (err, rows) {
      if (err) {
        clearTimeout(timeout);
        reject(err);
      } else {
        clearTimeout(timeout);
        resolve(true);
      }
    });
  })
}

//检查mysql和redis是否正常
exports.statusCheck = function (mysqlName, redisName) {
  let _this = this;
  return this.checkMysql(mysqlName).then(function () {
    return _this.checkRedis(redisName);
  }, function (err) {
    return Promise.reject(err)
  })
}

//释放所有连接
exports.release = function () {
  if (global.mdb && global.mdb.end) global.mdb.end();
  if (global.redis && global.redis.quit) global.redis.quit();
  if (global.mdb2 && global.mdb2.end) global.mdb2.end();
  if (global.redis2 && global.redis2.quit) global.redis2.quit();
  debug('释放mysql和redis连接'.gray);
  return true;
}