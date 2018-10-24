'use strict';
var MongoClient = require('mongodb').MongoClient;
var debug = require('debug')('mongo');

//mongo连接器
let mongo = module.exports = function () {
  this.conns = {};
}

/**
 * 创建一个或多个数据库连接
 * @purview public
 * @param {Object} config
 * @return {Object}
 */
mongo.prototype.createConn = function (config) {
  let _this = this;
  if (!config || typeof config != 'object') {
    return false;
  } else if (Array == config.constructor) {
    for (let c of config) {
      MongoClient.connect(c["address"], {
        poolSize: c["poolSize"], useNewUrlParser: true
      }, function (err, db) {
        if (err) throw err;
        debug(`mongo(${c.name})连接池创建成功`.green);
        _this.conns[c.name] = db
      });
    }
  } else if (config['name'] && config['address']) {
    MongoClient.connect(config["address"], {
      poolSize: config["poolSize"], useNewUrlParser: true
    }, function (err, db) {
      if (err) throw err;
      debug(`mongo(${config.name})连接池创建成功`.green);
      _this.conns[config.name] = db
    });
  } else {
    debug('mongo连接配置不正确'.red);
  }
  return this;
}

/**
 * 从已注册连接池获取连接
 * @purview public
 * @param {Object} config
 * @return {Object}
 */
mongo.prototype.getConn = function (dbName) {
  return this.conns[dbName];
}
