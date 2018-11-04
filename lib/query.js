"use strict";
let mysqlErrno = require('../config/mysqlerr');
let monitor = require('../lib/monitor');
let debug = require('debug')('lib:query');
let path = require('path');

//轻量查询构造器
//约定：所有非查询操作错误均返回false
const Query = function (tableName) {
  this._prefix = 'sc_';
  this._tableName = tableName;
  this._sql = '';
  this._pk = 'id';
  this._alias = 't';
  this._select = 't.*';
  this._record = {};
  this._conn = null;
  this._master = false;
  this._for_update = false;
  this._filterDeleted = true;
  this._foreignAttrs = {};
}

//调试SQL语句
let debugQuery = function (query, params) {
  let action = query.substr(0, 6).toLowerCase();
  if (action === 'delete') {
    debug("删除 %s".red, query);
  } else if (action === 'update') {
    debug("更新 %s".cyan, query);
  } else if (action === 'insert') {
    debug("添加 %s".green, query);
  } else if (action === 'select') {
    debug("查询 %s".yellow, query);
  } else {
    debug("执行 %s".yellow, query);
  }
}

/**
 * 初始化模型对象
 * 未指定前后文使用系统长连接
 * 默认一天缓存时间
 * @purview Public
 * @return {Query}
 */
Query.prototype.init = function () {
  this._page = 1;
  this._limit = 150;
  this._per_page = 150;
  this._condition = '';
  this._conditionGroup = [];
  this._group = '';
  this._order = 't.id DESC';
  this._params = [];
  this._join = '';
  this._save = {};
  this._cacheName = null;
  this._cacheExpire = 86400;
  this._format = true;
  this._error = '';
  this._action = '';
  return this;
}

//获取数据库连接
Query.prototype.getConn = function () {
  if (this._conn) return this._conn;
  return global.mdb ? global.mdb : false;
}

//指定数据库连接对象
Query.prototype.setConn = Query.prototype.conn = function (conn) {
  this._conn = conn ? conn : null;
  return this;
}

/**
 * 添加错误信息
 * @purview Public
 * @param {String} error
 * @return {Boolean}
 */
Query.prototype.addError = function (error) {
  this._error = error;
  return false;
}

/**
 * 返回错误信息
 * @purview Public
 * @return {String}
 */
Query.prototype.getError = function () {
  return this._error;
}

/**
 * 获取真实表名
 * @purview Public
 * @return {String}
 */
Query.prototype.getTableName = function () {
  return ~this._tableName.search(/^ud_/) ? this._tableName : this._prefix + this._tableName;
}

/**
 * 返回真实表名和别名
 * @purview Public
 * @return {String}
 */
Query.prototype.getAliseTableName = function () {
  return this.getTableName() + ' ' + this._alias;
}

/**
 * 入库验证器
 * @purview Public
 * @return {String}
 */
Query.prototype.validator = function () {
  if (Object.keys(this._save).length) {
    return Promise.resolve(true);
  } else {
    return Promise.reject(new Error('提交数据不能为空'));
  }
}

//是否格式化查询或操作结果
Query.prototype.format = function (val) {
  this._format = validator.toBoolean(val);
  return this;
}

/**
 * 设置查询字段
 * @purview Public
 * @param {String,Array} fields
 * @return {Query}
 */
Query.prototype.select = function (fields) {
  if (fields && typeof fields === 'string') {
    this._select = fields;
  } else if (fields && fields.constructor === Array) {
    this._select = fields.join(',');
  }
  return this;
}

/**
 * 设置其他查询字段
 * @purview Public
 * @param {String|Array} fields
 * @return {Query}
 */
Query.prototype.addSelect = function (fields) {
  if (fields && typeof fields === 'string') {
    this._select = this._select ? this._select + ',' + fields : this._select;
  } else if (fields && fields.constructor == Array) {
    this._select = this._select ? this._select + ',' + fields.join(',') : this._select;
  }
  return this;
}

/**
 * 设置缓存名称和过期时间(秒)
 * @purview Public
 * @param {String} name
 * @param {Number} expire(s)
 * @return {Query}
 */
Query.prototype.cache = function (name, expire) {
  if (!name) return this;
  this._cacheName = this._tableName + ':' + name;
  this._cacheExpire = validator.isPosInt(expire) ? expire : this._cacheExpire;
  return this;
}

/**
 * 保存缓存
 * @purview Public
 * @param {Object} data
 * @param {String} method
 * @return {Query}
 */
Query.prototype.setCache = function (data, method) {
  let _this = this;
  if (!this._cacheName) return Promise.resolve(false);
  if (method === 'set') {
    data = JSON.stringify(data);
  } else if (method === 'hmset') {
    data = lib.replaceNull(data);
  } else {
    return Promise.resolve(false);
  }
  return global.redis[method](this._cacheName, data).then(function (result) {
    return global.redis.expire(_this._cacheName, _this._cacheExpire).then(function () {
      debug('缓存 %s[%s] 保存成功'.green, _this._cacheName, method);
      return true;
    });
  }).catch(function (err) {
    debug("缓存 %s 保存失败 %s".red, _this._cacheName, err.message);
    return false;
  });
}

/**
 * 获取缓存
 * @purview Public
 * @param {String} name
 * @param {String} method
 * @return {Query}
 */
Query.prototype.getCache = function (method) {
  let _this = this;
  if (!this._cacheName) return Promise.resolve(null);
  if (['get', 'hgetall'].indexOf(method) < 0) return Promise.resolve(null);
  return global.redis[method](this._cacheName).then(function (result) {
    debug("读取 %s[%s] 缓存".cyan, _this._cacheName, method);
    if (validator.isEmpty(result)) return null;
    return method == 'get' ? JSON.parse(result) : result;
  }).catch(function (err) {
    debug("缓存 %s 读取失败 %s".red, _this._cacheName, err.message);
    return null;
  });
}

/**
 * 增加查询条件
 * 可以多次设置
 * @purview Public
 * @param {String} condition,string条件或json对象(仅限主表字段)
 * @param {Array} [params] 数组参数
 * @param {String} [operator] 连接符(AND||OR)
 * @return {Query}
 */
Query.prototype.where = function (condition, params, operator) {
  let oper = operator ? operator : 'AND';
  if (typeof condition === 'string' && condition) {
    this._condition = this._condition ? this._condition + ' ' + oper + ' (' + condition + ' ) ' : ' WHERE (' + condition + ')';
    if (params && typeof params === 'object' && params.constructor === Array) {
      this._params = this._params.concat(params);
    }
  } else if (typeof condition === 'object' && Object.keys(condition).length) {
    this._conditionGroup.push([condition, oper]);
  }
  return this;
}

/**
 * 根据指定参数自动设置条件
 * 例如page、limit、perPage等设置
 * @purview Public
 * @param {Object}
 * @return {Query}
 */
Query.prototype.addWhere = function (options) {
  options = options || {};
  if (options.select) {
    this.select(options.select);
  }
  if (validator.isPosInt(options.page)) {
    this.page(options.page);
  }
  if (validator.isPosInt(options.per_page)) {
    this.perPage(options.per_page);
  }
  if (validator.isIn(options.order, ['asc', 'desc'])) {
    this.order('t.id ' + options.order);
  }
  return this;
}

/**
 * 追加设置关联查询语句
 * @purview Public
 * @param {String} str
 * @return {Query}
 */
Query.prototype.group = function (str) {
  this._group = str ? " GROUP BY " + str : this._group;
  return this;
}

/**
 * 关联用户基本信息
 * @purview Public
 * @param {String} str
 * @return {Query}
 */
Query.prototype.joinUser = function (opts) {
  opts = opts || {};
  let select = opts.select ? opts.select : 'u.sex AS sex,u.name AS user_name,u.avatar_path AS avatar_path';
  this.addSelect(select);
  this.join('LEFT JOIN usho_user u ON u.id=' + this._alias + '.user_id');
  return this;
}

/**
 * 查询非关闭信息
 * @purview Public
 * @param {String} str
 * @return {Query}
 */
Query.prototype.notClosed = function () {
  this.where({is_closed: '=0'});
  return this;
}

/**
 * 构建SQL语句
 * @purview Public
 * @return {String}
 */
Query.prototype.builder = function () {
  let query = this._master ? '/*FORCE_MASTER*/' : '';
  if (this._action === 'count') {
    query += 'SELECT COUNT(' + this._alias + '.' + this._pk + ') as count';
  } else if (this._action === 'sum') {
    query += 'SELECT COALESCE(SUM(' + this._select + '),0) AS sum';
  } else {
    query += 'SELECT ' + this._select;
  }
  query += ' FROM ' + this.getAliseTableName();
  query += this._join ? this._join : '';
  query += this.getCondition();
  query += this._group;
  if (this._action === 'select') {
    query += ' ORDER BY ' + this._order + ' LIMIT ' + this.getOffset() + ' ';
  }
  query = this._for_update ? query + ' FOR UPDATE' : query;
  return query;
}

/**
 * 返回最终查询或删除条件
 * @purview Public
 * @param {String} [action] 操作，默认为search
 * @return {String}
 */
Query.prototype.getCondition = function () {
  let fieldPrefix = this._action === 'delete' ? '' : this._alias + '.';
  let condition = '';

  //不查询已经软删除的记录
  if ((this._action === 'select' || this._action === 'count' || this._action === 'sum') && this._filterDeleted) {
    this.where({is_deleted: '=0'});
    this._filterDeleted = false;
  }

  //循环设置分组条件
  for (let arr of this._conditionGroup) {
    let json = arr[0];
    let operator = arr[1];
    let cond = '';
    for (let field in json) {
      cond = cond ? cond + ' AND ' + fieldPrefix + field + json[field] : fieldPrefix + field + json[field];
    }
    if (cond) {
      condition = condition ? condition + ' ' + operator + ' (' + cond + ')' : '(' + cond + ')';
    }
  }
  if (this._condition && condition) {
    return this._condition + ' ' + this._conditionGroup[0][1] + ' ' + condition;
  } else if (this._condition) {
    return this._condition;
  } else if (condition) {
    return ' WHERE ' + condition;
  } else {
    return '';
  }
}

/**
 * 设置排序
 * @purview public
 * @param {String} order
 * @return {Query}
 */
Query.prototype.order = function (order) {
  this._order = (typeof order === 'string' && order.length > 0) ? order : this._order;
  return this;
}

/**
 * 设置显示页码
 * @purview public
 * @param {Number} page
 * @return {Query}
 */
Query.prototype.page = function (page) {
  this._page = page && (page + '').match(/^[0-9]+$/) ? page : this._page;
  return this;
}

/**
 * 指定每页显示条数
 * @purview public
 * @param {Number} value
 * @return {Query}
 */
Query.prototype.perPage = function (value) {
  this._per_page = value;
  this.limit(value);
  return this;
}

/**
 * 限定查询条数
 * @purview public
 * @param {Number} value
 * @return {Query}
 */
Query.prototype.limit = function (value) {
  this._limit = value;
  return this;
}

/**
 * 获取查询偏移量
 * @purview public
 * @return {String}
 */
Query.prototype.getOffset = function () {
  this._page = this._page ? this._page : 1;
  return ((this._page - 1) * this._per_page) + ',' + this._limit;
}

/**
 * 设置关联查询
 * @purview Public
 * @param {String} str
 * @return {Query}
 */
Query.prototype.join = function (str) {
  this._join += ' ' + str;
  return this;
}

/**
 * 设置是否过滤软删除记录
 * @purview Public
 * @param {Boolean} status
 * @return {Query}
 */
Query.prototype.filterDeleted = function (status) {
  this._filterDeleted = status;
  return this;
}

/**
 * 设置从主库查询
 * 返回数据json
 * @purview Public
 * @param {String||Object} condition
 * @param {Object} params
 * @return {Promise}
 */
Query.prototype.master = function () {
  this._master = true;
  return this;
}

/**
 * 设置锁表
 * @purview Public
 * @return {Promise}
 */
Query.prototype.forUpdate = function () {
  this._master = true;
  this._format = false;
  this._for_update = true;
  return this;
}

/**
 * 根据其他查询条件查询
 * 缓存永远只存原始数据，返回才进行格式化
 * @purview Public
 * @return {Promise}
 */
Query.prototype.find = function () {
  let _this = this;
  this._action = 'select';
  return this.getCache('hgetall').then(function (record) {
    _this._limit = 1;
    if (record) {
      _this._record = record;
      return record;
    }
    return _this.execute(_this.builder(), _this._params).then(function (records) {
      if (records && records.length && _this._cacheName) _this.setCache(records[0], 'hmset');
      return records && records.length ? records[0] : {};
    });
  }).then(function (record) {
    if (!record || !Object.keys(record).length) return {};
    _this._record = record;
    return _this._format ? lib.dataFormat(record) : record;
  }).catch(function (err) {
    debug('数据查询失败 %s'.red, err.message);
    return {};
  });
}

/**
 * 根据主键查询
 * 无信息返回空对象
 * @purview Public
 * @param {Number} id
 * @return {Promise}
 */
Query.prototype.findByPk = function (id) {
  if (!validator.isPosInt(id)) return Promise.resolve({});
  let _this = this;
  return this.where('t.id=?', [id]).find().then(function (record) {
    if (!Object.keys(record).length) global['redis'].rpush('query:miss_find_by_pk', JSON.stringify({
      id: id,
      table: _this._tableName,
      sql: _this._sql,
      thread_id: global['mdb'] ? global['mdb']['threadId'] : '',
      entry_filename: process.mainModule.filename,
      datetime: lib.datetime()
    }));
    return record;
  });
}

/**
 * 查询数据，没有进行创建
 * 有信息返回对象，没有创建完返回新ID
 * @purview Public
 * @param {Object} data
 * @return {Promise}
 */
Query.prototype.findOrCreate = function (data) {
  let _this = this;
  return this.find().then(function (record) {
    if (!validator.isEmpty(record)) return record;
    return _this.create(data).then(function (result) {
      if (false === result) return {};
      _this._conditionGroup = [];
      return _this.master().findByPk(result);
    });
  });
}

/**
 * 创建或更新
 * 如果有记录，进行更新
 * @purview Public
 * @param {Object} data
 * @return {Promise}
 */
Query.prototype.createOrUpdate = function (data) {
  let _this = this;
  return this.find().then(function (record) {
    if (validator.isEmpty(record)) {
      return _this.create(data);
    } else {
      return _this.update(data);
    }
  });
}

/**
 * 查询一组数据
 * 有数据返回数组，无数据返回空数组
 * @purview Public
 * @return {Promise}
 */
Query.prototype.findAll = function () {
  let _this = this;
  this._action = 'select';
  return this.getCache('get').then(function (records) {
    if (records) return records;
    return _this.execute(_this.builder(), _this._params).then(function (records) {
      if (records && records.length && _this._cacheName) _this.setCache(records, 'set');
      return records && records.length ? records : [];
    });
  }).then(function (records) {
    if (!records || !records.length) return [];
    return _this._format ? lib.dataFormat(records) : records;
  }).catch(function (err) {
    debug('数据查询失败 %s'.red, err.message);
    return [];
  });
}

/**
 * 返回指定字段数组
 * 有信息返回数组，无数据返回空数组
 * @purview Public
 * @param {String} field
 * @return {Promise}
 */
Query.prototype.findIds = function (field) {
  return this.perPage(3000).findAll().then(function (records) {
    return records.map(function (r) {
      return field ? parseInt(r[field]) : parseInt(r.id);
    });
  });
}

/**
 * 调用mysql查询方法
 * @purview Public
 * @param {String} query
 * @param {Array} params
 * @return {Promise}
 */
Query.prototype.execute = function (query, params) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    let _query = _this.getConn().query(query, params, function (err, rows) {
      if (err) {
        let errno = err.errno || '';
        debug('数据库查询错误 errno：%s'.red, errno);
        debug('%s'.red, err.message);
        debug('%s'.red, _query.sql);
        err.message += '<br>' + _query.sql;
        _this._sql = _query.sql;
        global.redis['rpush']('mysql_query_error', JSON.stringify({
          message: err.message,
          sql: _query.sql,
          errno: err.errno || '',
          stack: err.stack || '',
          datetime: lib.datetime()
        }));
        monitor.sendApiError('lib.query执行错误', err);
        let message = errno && mysqlErrno[errno] ? mysqlErrno[errno] : '数据库查询或处理失败(' + errno + err.message + ')';
        reject(new Error(message));
      } else {
        _this._sql = _query.sql;
        debugQuery(_query.sql);
        resolve(rows);
      }
    });
  });
}

/**
 * 调用mysql查询方法
 * @purview Public
 * @param {String} query
 * @param {Array} params
 * @return {Promise}
 */
Query.prototype.query = function (query, params) {
  let _this = this;
  this._action = 'execute';
  params = arguments[1] ? arguments[1] : [];
  return this.getCache('get').then(function (records) {
    if (!validator.isEmpty(records)) return records;
    return _this.execute(query, params).then(function (records) {
      if (records.length && _this._cacheName) _this.setCache(records, 'set');
      return records;
    });
  });
}

/**
 * 总数统计
 * @purview Public
 * @param {String} join
 * @return {Promise}
 */
Query.prototype.count = function () {
  let _this = this;
  this._action = 'count';
  return this.getCache('get').then(function (count) {
    if (count !== null) return count;
    return _this.execute(_this.builder(), _this._params).then(function (records) {
      let count = records.length ? records[0]['count'] : 0;
      if (_this._cacheName) _this.setCache(count, 'set');
      return count;
    });
  });
}

/**
 * 总数统计
 * @purview Public
 * @param {String} join
 * @return {Object}
 */
Query.prototype.sum = function (field) {
  let _this = this;
  this._action = 'sum';
  this._select = field ? field : this._select;
  return this.getCache('get').then(function (count) {
    if (count !== null) return count;
    return _this.execute(_this.builder(), _this._params).then(function (records) {
      let count = records.length ? records[0]['sum'] : 0;
      if (_this._cacheName) _this.setCache(count, 'set');
      return count;
    });
  });
}

/**
 * 判断是否存在
 * @purview Public
 * @param {String} join
 * @return {Promise}
 */
Query.prototype.isExist = function () {
  return this.count().then(function (count) {
    return count ? true : false;
  });
}

/**
 * 设置添加
 * 转换true
 * @purview Public
 * @param {String} key
 * @return {String|Number} value
 */
Query.prototype.setAttribute = function (key, value) {
  if (key === 'id') return this;
  value = validator.trim(value);

  if (key.indexOf('is_') >= 0) {
    if (validator.isInt(value)) {
      //保持不变
      value = parseInt(value);
    } else if (validator.isBoolean(value)) {
      value = validator.toBoolean(value) ? 1 : 0;
    } else {
      value = 0;
    }
  } else if (key.indexOf('_amount') >= 0 || key === 'amount') {
    value = parseInt(value * 100)
  } else if (['content','html','modules'].indexOf(key)>=0) {
    value = lib.richTextFilter(value);
  } else {
    value = lib.textFilter(value);
  }
  this._save[key] = value;
  return this;
}

/**
 * 设置添加或保存原始数据
 * @purview Public
 * @param {Object||String} join
 * @return {Object}
 */
Query.prototype.setAttributes = function (data) {
  if (typeof(data) === 'string' && arguments[1]) {
    this.setAttribute(data, arguments[1]);
  } else if (typeof(data) === 'object' && Object.keys(data).length) {
    for (let key in data) {
      this.setAttribute(key, data[key]);
    }
  }
  return this;
}

/**
 * 插入数据
 * 成功返回新插入数据，失败返回false
 * @purview Public
 * @param {Object} data
 * @return {Object}
 */
Query.prototype.create = function (data) {
  let _this = this;
  this._action = 'insert';
  this.setAttributes(data);
  return this.validator().then(function () {
    let sql = 'INSERT INTO ' + _this.getTableName() + ' SET ?';
    return _this.execute(sql, _this._save);
  }).then(function (result) {
    if (result.insertId) {
      _this._record = lib.extend({id: result.insertId}, _this._save);
    }

    return result.insertId ? result.insertId : 0;
  });
}

/**
 * 修改单条记录
 * 触发更新缓存事件
 * @purview Public
 * @param {Object} data
 * @return {Object}
 */
Query.prototype.update = function (data) {
  let _this = this;
  this.setAttributes(data);
  if (!this.getCondition()) {
    return this.addError('请指定修改条件');
  } else if (!Object.keys(this._save).length) {
    return this.addError('修改内容不能为空');
  }
  //保存数据
  this._action = 'update';
  //设置更新数据
  let fields = [];
  let params = [];
  for (let key in this._save) {
    fields.push(this._alias + '.' + key + '=?');
    params.push(this._save[key]);
  }
  let query = 'UPDATE ' + this.getAliseTableName();
  query += params.length ? ' SET ' + fields.join(',') : '';
  query += this.getCondition();
  params = params.concat(this._params);
  return this.execute(query, params).then(function (result) {
    if (_this._cacheName) {
      global.redis.del(_this._cacheName);
      debug(`删除缓存${_this._cacheName}`.yellow);
    }
    return parseInt(result.affectedRows);
  });
}

/**
 * 查询并修改一批记录
 * 成功返回影响的记录数，失败返回false
 * @purview Public
 * @param {String} join
 * @return {Promse}
 */
Query.prototype.updateAll = function (data) {
  this.setAttributes(data);
  if (!this.getCondition()) {
    return this.addError('请指定修改内容');
  } else if (!Object.keys(this._save).length) {
    return this.addError('修改内容不能为空');
  }
  this._action = 'update';
  let fields = [];
  let params = [];
  for (let key in this._save) {
    fields.push(this._alias + '.' + key + '=?');
    params.push(this._save[key]);
  }
  let query = 'UPDATE ' + this.getAliseTableName();
  query += params.length ? ' SET ' + fields.join(',') : '';
  query += this.getCondition();
  params = params.concat(this._params);
  return this.execute(query, params).then(function (result) {
    return parseInt(result.affectedRows);
  });
}


/**
 * 批量删除
 * 必须指定至少一个条件
 * 成功返回影响的记录数，失败返回false
 * @purview Public
 * @return {Number}
 */
Query.prototype.deleteAll = function () {
  this.setAttribute('is_deleted', 1);
  return this.updateAll();
}

Query.prototype.deleteUD = function () {
  this._action = 'delete';
  if (!this._record.id) {
    this.addError('未激活任何记录');
    return this.addError('未激活任何记录');
  }

  let query = 'DELETE FROM ' + this.getTableName() + ' WHERE id=?'
  return this.execute(query, this._record.id).then(function (result) {
    return parseInt(result.affectedRows);
  })
}

/**
 * 批量删除记录, 育金表使用
 * @purview Public
 * @return {Promise}
 */
Query.prototype.deleteAllUD = function () {

  this._action = 'delete';

  if (!this.getCondition()) {
    return this.addError('未指定任何查询条件');
  }

  let query = 'DELETE FROM ' + this.getTableName() + this.getCondition()

  return this.execute(query).then(function (result) {
    return parseInt(result.affectedRows);
  })
};

//创建model引用
exports.factory = function (tableName) {
  return new Query(tableName).init();
}

//直接执行SQl语句
exports.query = function (sql, params) {
  return new Promise(function (resolve, reject) {
    let _query = global.mdb.query(sql, params, function (err, rows) {
      debugQuery(_query.sql);
      if (err) reject(err);
      resolve(rows);
    });
  });
}

//返回redis全局连接
exports.getRedis = function (name) {
  return name ? global[name] : global.redis;
}

//各类查询表达式
exports.eq = function (value) {
  return '="' + lib.safeFilter(value) + '"';
}
exports.ne = function (value) {
  return '!="' + lib.safeFilter(value) + '"';
}
exports.gt = function (value) {
  return '>' + (typeof(value) === 'number' ? value : '1');
}
exports.gte = function (value) {
  return '>=' + (typeof(value) === 'number' ? value : '1');
}
exports.lt = function (value) {
  return '<' + (typeof(value) === 'number' ? value : '1');
}
exports.lte = function (value) {
  return '<=' + (typeof(value) === 'number' ? value : '1');
}
exports.like = function (value) {
  return ' LIKE "' + lib.safeFilter(value) + '"';
}
exports.in = function (value) {
  value = validator.isArray(value) && value.length && value[0] !== '' ? value : [-1];
  return ' IN (' + value.join(',') + ')';
}
exports.notin = function (value) {
  value = validator.isArray(value) && value.length && value[0] !== '' ? value : [-1];
  return ' NOT IN (' + value.join(',') + ')';
}