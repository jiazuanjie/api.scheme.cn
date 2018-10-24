'use strict';
let co = require('co');
let _mysql = require('mysql');
let mconfig = require('../config/main');
let debug = require('debug')('lib:mysql');
require('./common');

//mysql连接
let mysql = module.exports = function (config) {
  config = config && typeof(config) === 'object' ? config : {};
  this.config = Object.assign({}, mconfig.mdb, config);
  this.pool = {};
  this.conn = {};
  this.reconned = 0;
}

//创建一个连接池
mysql.prototype.createPool = function () {
  this.pool = _mysql.createPool(this.config);
  this.pool.on('enqueue', function () {
    debug('等待可用的空闲连接'.yellow);
  });
  this.pool.on('error', function (err) {
    debug('连接池创建失败 %s'.red, err.message);
  });
  this.pool.on('connection', function (conn) {
    conn.query('set names utf8mb4', function (err, rows) {
      debug('连接池创建成功'.green);
    });
  });
  return this.pool;
}

//从连接池获取一个连接
mysql.prototype.getConn = function () {
  let pool = this.pool;
  if (!pool) return Promise.reject(new Error('mysql连接池尚未初始化'));
  return new Promise(function (resolve, reject) {
    pool.getConnection(function (err, conn) {
      if (err) {
        debug("连接池连接获取失败 %s".red, err.message);
        reject(err);
      } else {
        debug("获取连接池连接成功 %d".green, conn.threadId);
        resolve(conn);
      }
    });
  })
}

//创建一个连接对象
//如果设置globalName,连接成功后自动赋值给全局对象
mysql.prototype.createConn = function (globalName) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.conn = _mysql.createConnection(_this.config);
    //中途错误监控
    _this.conn.on('error', function (err) {
      debug('%s连接出错 %s'.red, globalName, err.message);
      //错误主动断开连接
      if (typeof(_this.conn.end) === 'function') _this.conn.end();
      //丢失连接自动重连
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        debug('%s连接丢失,重新连接'.yellow, globalName);
        //错误临时调试
        if (global.redis) global.redis.rpush('mysql_connection_error:' + process.pid, err.message);
        _this.createConn(globalName);
      } else if (_this.reconned < 5) {
        _this.reconned += 1;
        debug('%s连接失败,1秒后重新连接'.yellow, globalName);
        //错误临时调试
        if (global.redis) global.redis.rpush('mysql_connection_error:' + process.pid, err.message);
        setTimeout(_this.createConn(globalName), 1000);
      } else {
        throw err;
      }
    });
    //连接事件
    _this.conn.connect(function (err) {
      if (err) {
        debug('%s连接失败 %s'.red, globalName, err.message);
        reject(err);
      } else {
        _this.conn.query('set names utf8mb4');
        debug("%s连接成功 %d".green, globalName, _this.conn.threadId);
        if (globalName) global[globalName] = _this.conn;
        resolve(true);
      }
    });
  })
}