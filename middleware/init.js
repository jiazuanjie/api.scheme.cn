const mconfig = require('../config/main');
const _redis = require('../lib/redis');
const _mysql = require('../lib/mysql');
const Orm = require('../lib/orm');
const mquery = require('../lib/mquery');
const _mongo = require('../common/lib/mongo');
const models = require('./../lib/models');
//const _rabbitmq = require('../lib/rabbitmq');
const debug = require('debug')('app:init');

//创建数据库连接池
let mysql = new _mysql();
mysql.createPool();
mysql.createConn('mdb');

//创建redis连接
let redis = new _redis();
redis.createConn('redis');

//注册mongo连接
let mongo = new _mongo();
mongo.createConn(mconfig['mongodb']['scheme']);
mongo.createConn(mconfig['mongodb']['community'])

//初始化请求
//每个用户请求都不同
module.exports = function () {
  return async (ctx, next) => {
    ctx.post = ctx.request.body || {};
    ctx.data = {};
    // mysql主连接
    ctx.mdb = await mysql.getConn();

    // 手动连接
    ctx.getConn = function () {
      return mysql.getConn();
    }

    //model定义方法
    ctx.model = function (name) {
      return models.factory(name).setConn(ctx.mdb);
    };
    // 轻量查询器
    ctx.orm = function (name) {console.log("ds");
      return Orm.factory(name).setConn(ctx.mdb);
    }
    //返回指定mongo连接
    ctx.mongo = function (db) {
      return mongo.getConn(db);
    };
    //返回mongo查询器
    ctx.mquery = function (db) {
      return mquery.factory(mongo.getConn(db));
    };

    await next();

    //输出模板
    if ('string' === typeof ctx.body) {

    } else if ('object' === typeof ctx.warning) {
      ctx.body = {status: 1, errno: ctx.warning.errno, result: {message: ctx.warning.message}};
    } else if (ctx.warning) {
      ctx.body = {status: 1, errno: 1000, result: {message: ctx.warning}};
    } else if (ctx.data.result) {
      ctx.body = {status: 1, errno: 0, result: ctx.data.result};
    } else if (!Object.keys(ctx.data).length) {
      ctx.body = {status: 1, errno: 404, result: {message: '访问地址不存在或已删除'}};
    } else {
      ctx.data.status = 1;
      ctx.data.errno = 0;
      ctx.body = ctx.data;
    }

    // 垃圾回收
    ctx.mdb && ctx.mdb.release();
    ctx.mdb = null;
    ctx.post = null;
    ctx.data = null;
    ctx.model = null;
  }
};


