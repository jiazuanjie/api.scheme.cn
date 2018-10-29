"use strict";
let co = require('co');
let mysqlErrno = require('../config/mysqlerr');
let monitor = require('../lib/monitor');
let debug = require('debug')('lib:orm');
let path = require('path');


//调试SQL语句
let debugQuery = function (query) {
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
};

//Orm查询类
//约定：所有操作，失败均返回false
//attribute为null，表示未定义model文件
const Orm = function (tableName, attributes) {
  this._conn = false;
  this._prefix = 'sc_';
  this._tableName = tableName;
  this._pk = 'id';
  this._alias = 't';
  this._select = 't.*';
  this._order = 't.id DESC';
  this._foreignAttrs = {};
  this._filterDeleted = true;
  this._isValidate = true;
  this._attribute = arguments[1] || null;
  this._filter = false;
  this._master = false;
  this._for_update = false;
  this._format = true;
};

//免创建model引用
Orm.factory = function (tableName) {
  return new Orm(tableName).init();
};

//初始化模型对象
//未指定前后文使用系统长连接
//默认一天缓存时间
Orm.prototype.init = function () {
  this._page = 1;
  this._limit = 15;
  this._ignore_limit = false;
  this._per_page = 15;
  this._add_offset = 0;
  this._record = {};
  this._records = [];
  this._condition = '';
  this._conditionGroup = [];
  this._group = '';
  this._params = [];
  this._join = '';
  this._save = {};
  this._cacheName = null;
  this._cacheExpire = 86400;
  this._error = '';
  this._action = '';
  this._uid = 0;
  this._counts = {
    options: {},
    page: this._page,
    per_page: this._per_page,
    total_items: 0,
    total_page: 0
  };
  return this;
};

//重置所有查询属性
Orm.prototype.reset = function () {
  this._select = 't.*';
  this._order = 't.id DESC';
  this._foreignAttrs = {};
  this._filterDeleted = true;
  this._isValidate = true;
  this._attribute = arguments[1] || null;
  this._filter = false;
  this._master = false;
  this._for_update = false;
  this._format = true;
  this.init();
  return this;
};

//指定数据库连接对象
Orm.prototype.setConn = function (conn) {
  this._conn = conn ? conn : false;
  return this;
};

//获取数据库连接
Orm.prototype.getConn = function () {
  if (this._conn) return this._conn;
  return global.mdb ? global.mdb : false;
};

//设置前缀
Orm.prototype.prefix = function (str) {
  this._prefix = str;
  return this;
};

Orm.prototype.removeLimit = function (value) {
  this._ignore_limit = value;
  return this;
};

//设置当前用户ID
Orm.prototype.setUid = function (id) {
  this._uid = id;
  return this;
};

//获取真实表名
Orm.prototype.getTableName = function () {
  return this._prefix + this._tableName;
};

//返回真实表名和别名
Orm.prototype.getAliseTableName = function () {
  return this.getTableName() + ' ' + this._alias;
};

//查找数据之前
Orm.prototype.beforeFind = function () {
  if (this._error) {
    return Promise.reject(new Error(this._error));
  } else {
    return Promise.resolve(true);
  }
};

//查找数据之后
Orm.prototype.afterFind = function () {
  if (this._filter && validator.isArray(this._filter)) {
    for (let key of Object.keys(this._record)) {
      if (this._filter.indexOf(key) < 0) delete this._record[key];
    }
  } else if (this._filter && typeof(this._filter) === 'function') {
    for (let key of Object.keys(this._record)) {
      this._filter.call(this, key, this._record[key]);
      if (key.indexOf('_amount') || key === 'amount') {
        this._record[key] = this._record[key] / 100
      }
    }
  }
  return Promise.resolve(this._format ? lib.dataFormat(this._record) : this._record);
};

//查找多条结果之后
Orm.prototype.afterFindAll = function () {
  if (this._filter && typeof(this._filter) === 'function') {
    for (let r of this._records) {
      this._filter.call(this, r);
    }
  }
  return Promise.resolve(this._format ? lib.dataFormat(this._records) : this._records);
};

//数据添加之前
Orm.prototype.beforeCreate = function () {
  if (this._error) {
    return Promise.reject(new Error(this._error));
  } else {
    return Promise.resolve(true);
  }
};

//数据添加之后
Orm.prototype.afterCreate = function () {
  this._record = lib.dataFormat(this._record);
  return Promise.resolve(this._record);
};

//数据修改之前
Orm.prototype.beforeSave = function () {
  if (this._error) {
    return Promise.reject(new Error(this._error));
  } else {
    return Promise.resolve(true);
  }
};

//数据修改之后
Orm.prototype.afterSave = function () {
  let cacheName = this._cacheName;
  if (this._cacheName) {
    global.redis.del(cacheName);
    debug('删除缓存 %s'.red, cacheName);
  }
  return Promise.resolve(true);
};

//数据删除之前执行
Orm.prototype.beforeDelete = function () {
  if (this._error) {
    return Promise.reject(new Error(this._error));
  } else {
    return Promise.resolve(true);
  }
};

//删除之后执行
Orm.prototype.afterDelete = function () {
  let cacheName = this._cacheName;
  if (this._cacheName) {
    global.redis.del(cacheName);
    debug('删除缓存 %s'.red, cacheName);
  }
  return Promise.resolve(true);
};

/**
 * 入库验证器
 * @purview Public
 * @param {String} error
 * @return Promise
 */
Orm.prototype.validator = function () {
  if (Object.keys(this._save).length) {
    return Promise.resolve(true);
  } else {
    return Promise.reject("添加数据不能为空");
  }
};


//是否格式化查询或操作结果
Orm.prototype.format = function (val) {
  this._format = validator.toBoolean(val);
  return this;
};

/**
 * 添加错误并返回false
 * @purview Public
 * @param {String} error
 * @return false
 */
Orm.prototype.addError = function (error) {
  this._error = error;
  debug('orm操作失败 %s'.red, error);
  return Promise.resolve(false);
};

//返回活动记录
Orm.prototype.getError = function () {
  return this._error;
};

/**
 * 添加错误信息
 * @purview Public
 * @param {String,Array} error
 * @return Promise
 */
Orm.prototype.resolve = function (result) {
  return Promise.resolve(result ? result : true);
};

/**
 * 返回一个错误
 * @purview Public
 * @param {String} error
 * @return Promise
 */
Orm.prototype.reject = function (error) {
  this._error = error;
  return Promise.reject(new Error(error));
};

/**
 * 设置查询字段
 * @purview Public
 * @param {String,Array} fields
 * @return {Object}
 */
Orm.prototype.select = function (fields) {
  if (fields && typeof fields === 'string') {
    this._select = fields;
  } else if (fields && fields.constructor === Array) {
    this._select = fields.join(',');
  }
  return this;
};

/**
 * 设置其他查询字段
 * @purview Public
 * @param {String,Array} fields
 * @return {Object}
 */
Orm.prototype.addSelect = function (fields) {
  if (fields && typeof fields === 'string') {
    this._select = this._select ? this._select + ',' + fields : this._select;
  } else if (fields && fields.constructor == Array) {
    this._select = this._select ? this._select + ',' + fields.join(',') : this._select;
  }
  return this;
};


/**
 * 设置缓存名称和过期时间(秒)
 * @purview Public
 * @param {String} name
 * @param {Number} expire(s)
 * @return {Object}
 */
Orm.prototype.cache = function (name, expire) {
  if (!name) return this;
  this._cacheName = this._tableName + ':' + name;
  this._cacheExpire = validator.isPosInt(expire) ? expire : this._cacheExpire;
  return this;
};

/**
 * 保存缓存
 * @purview Public
 * @param {Object} data
 * @param {String} method
 * @return {Object}
 */
Orm.prototype.setCache = function (data, command) {
  let _this = this;
  if (!this._cacheName || !command || !data) return Promise.resolve(false);
  return global.redis[command](this._cacheName, command === 'set' ? JSON.stringify(data) : data).then(function () {
    global.redis.expire(_this._cacheName, _this._cacheExpire);
    debug('缓存 %s type %s 保存成功'.green, _this._cacheName, command);
    return true;
  }).catch(function (err) {
    debug('缓存 %s 保存失败 %s'.red, this._cacheName, err.message);
    return false;
  });
};

/**
 * 获取缓存
 * @purview Public
 * @param {String} name
 * @param {String} method
 * @return {Object}
 */
Orm.prototype.getCache = function (method) {
  let _this = this;
  if (!this._cacheName) return Promise.resolve(null);
  return global.redis[method](this._cacheName).then(function (data) {
    if (!validator.isEmpty(data)) {
      debug('读取缓存 %s'.magenta, _this._cacheName);
      return method == 'get' ? JSON.parse(data) : data;
    } else {
      return null;
    }
  });
};

/**
 * 增加查询条件
 * @purview Public
 * @param {String} condition,string条件或json对象(仅限主表字段)
 * @param {Array} [params] 数组参数
 * @param {String} [operator] 连接符(AND||OR)
 * @return {Object}
 */
Orm.prototype.where = function (condition, params, operator) {
  let oper = operator ? operator : 'AND';
  if (typeof condition === 'string' && condition) {
    this._condition = this._condition ? this._condition + ' ' + oper + ' (' + condition + ' ) ' : ' WHERE (' + condition + ')';
    if (params && typeof params === 'object' && params.constructor === Array) {
      this._params = this._params.concat(lib.safeFilter(params));
    }
  } else if (typeof condition === 'object' && Object.keys(condition).length) {
    this._conditionGroup.push([condition, oper]);
  }
  return this;
};

//设置更多条件
Orm.prototype.addWhere = function (options) {
  options = options || {};
  if (options.select) {
    this.select(options.select);
  }
  if (validator.isPosInt(options.page)) {
    this.page(options.page);
  }
  if (validator.isInt(options.per_page)) {
    this.perPage(options.per_page);
  }
  if (validator.isInt(options.limit)) {
    this.limit(options.limit);
  }
  if (validator.isIn(options.order, ['ASC', 'DESC'])) {
    this.order('t.id ' + options.order);
  }
  return this;
};

/**
 * 清除所有查询条件
 * @purview Public
 * @param {String} condition,string条件或json对象(仅限主表字段)
 * @param {Array} [params] 数组参数
 * @param {String} [operator] 连接符(AND||OR)
 * @return {Object}
 */
Orm.prototype.removeWhere = function () {
  this._conditionGroup = [];
  return this;
};

/**
 * 分组
 * @purview Public
 * @return {Object}
 */
Orm.prototype.group = function (str) {
  this._group = str ? " GROUP BY " + str : this._group;
  return this;
};

//关联用户基本信息
Orm.prototype.joinUser = function (opts) {
  var opts = opts || {};
  let select = opts.select ? opts.select : 'u.sex AS sex,u.name AS user_name,u.avatar_path AS avatar_path';
  let foreignKey = opts.foreignKey ? opts.foreignKey : 'user_id';
  this.addSelect(select);
  this.join('LEFT JOIN usho_user u ON u.id=' + this._alias + '.' + foreignKey);
  opts = null;
  return this;
};

//查询非关闭记录
Orm.prototype.notClosed = function () {
  this.where({is_closed: Orm.eq(0)});
  return this;
};

/**
 * 忽略数据校验
 * 提供给后台系统使用
 * @purview Public
 * @return {Object}
 */
Orm.prototype.notValidate = function () {
  this._isValidate = false;
  return this;
};

/**
 * 构建SQL语句
 * @purview Public
 * @param {String} action
 * @return {String}
 */
Orm.prototype.builder = function () {
  let query = this._master ? '/*FORCE_MASTER*/' : '';
  if ('count' === this._action) {
    query += 'SELECT COUNT(' + this._alias + '.' + this._pk + ') as count';
    if (this._counts.options && this._counts.options.sums && this._counts.options.sums.length) {
      for (let sum of this._counts.options.sums) {
        query += ',COALESCE(SUM(' + sum.field + '),0) AS ' + sum.name;
      }
    }
  } else if ('sum' === this._action) {
    query += 'SELECT COALESCE(SUM(' + this._select + '),0) AS sum';
  } else {
    query += 'SELECT ' + this._select;
  }
  query += ' FROM ' + this.getAliseTableName();
  query += this._join ? this._join : '';
  query += this.getCondition();
  query += this._group;
  if (this._action === 'select') {
    query += ' ORDER BY ' + this._order;
    if (this._ignore_limit === false) {
      query += ' LIMIT ' + this.getOffset() + ' '
    }
  }
  query = this._for_update ? query + ' FOR UPDATE' : query;
  return query;
};

/**
 * 返回最终查询或删除条件
 * @purview Public
 * @param {String} [action] 操作，默认为search
 * @example
 * @return {String}
 */
Orm.prototype.getCondition = function () {

  let fieldPrefix = this._action === 'delete' ? '' : this._alias + '.';
  let condition = '';

  //不查询已经软删除的信息
  if ((this._action === 'select' || this._action === 'count' || this._action === 'sum') && this._filterDeleted) {
    this.where({is_deleted: '=0'});
    this._filterDeleted = false;
  }

  //循环设置分组条件
  this._conditionGroup.forEach(function (arr) {
    let json = arr[0];
    let operator = arr[1];
    let cond = '';
    for (let field in json) {
      cond = cond ? cond + ' AND ' + fieldPrefix + field + json[field] : fieldPrefix + field + json[field];
    }
    if (cond) {
      condition = condition ? condition + ' ' + operator + ' (' + cond + ')' : '(' + cond + ')';
    }
  });
  if (this._condition && condition) {
    return this._condition + ' ' + this._conditionGroup[0][1] + ' ' + condition;
  } else if (this._condition) {
    return this._condition;
  } else if (condition) {
    return ' WHERE ' + condition;
  } else {
    return '';
  }
};

/**
 * 设置排序
 * @purview public
 * @param {String} order
 * @return {Object}
 */
Orm.prototype.order = function (order) {
  this._order = (typeof order === 'string' && order.length > 0) ? order : this._order;
  return this;
};

/**
 * 设置显示页码
 * @purview public
 * @param {Number} limit
 * @param {Number} limit
 * @return {Object}
 */
Orm.prototype.page = function (page) {
  this._page = page && (page + '').match(/^[0-9]+$/) ? parseInt(page) : this._page;
  return this;
};

/**
 * 指定每页显示条数
 * @purview public
 * @param {Number} offset
 * @param {Number} limit
 * @return {Object}
 */
Orm.prototype.perPage = function (number) {
  if (number && validator.isInt(number, {min: 1, max: 300})) {
    this._per_page = parseInt(number);
    this.limit(this._per_page);
  }
  return this;
};

/**
 * 限定查询条数
 * @purview public
 * @param {Number} offset
 * @param {Number} limit
 * @return {Object}
 */
Orm.prototype.limit = function (value) {
  this._limit = value;
  return this;
};

/**
 * 额外增加偏移量
 * @purview public
 * @param {Number} offset
 * @param {Number} limit
 * @return {Object}
 */
Orm.prototype.addOffset = function (value) {
  this._add_offset = value;
  return this;
};

/**
 * 获取查询偏移量
 * @purview public
 * @param {Number} offset
 * @param {Number} limit
 * @return {Object}
 */
Orm.prototype.getOffset = function () {
  this._page = this._page ? this._page : 1;
  return ((this._page - 1) * this._per_page) + parseInt(this._add_offset) + ',' + this._limit;
};

/**
 * 设置关联查询
 * @purview Public
 * @param {String} join
 * @return {Object}
 */
Orm.prototype.join = function (str) {
  this._join += ' ' + str;
  return this;
};

/**
 * 设置是否过滤软删除记录
 * 返回数据json
 * @purview Public
 * @param {String||Object} condition
 * @param {Object} params
 * @return {Object}
 */
Orm.prototype.filterDeleted = function (status) {
  this._filterDeleted = status;
  return this;
};

/**
 * 设置查询结果过滤器
 * @purview Public
 * @param {function||Array} func
 * @return {Object}
 */
Orm.prototype.filter = function (func) {
  this._filter = typeof(func) === 'object' || typeof(func) === 'function' ? func : false;
  return this;
};

/**
 * 指定从主库读取
 * @purview Public
 * @param {Boolean} status
 * @return {Query}
 */
Orm.prototype.master = function () {
  this._master = true;
  return this;
};

/**
 * forupdate锁表
 * @purview Public
 * @param {Boolean} status
 * @return {Query}
 */
Orm.prototype.forUpdate = function () {
  this._for_update = true;
  return this;
};

/**
 * 无条件和无事件出发查询
 * 返回数据json
 * @purview Public
 * @param {String||Object} condition
 * @param {Object} params
 * @return {Promise}
 */
Orm.prototype.getRecord = function () {
  let _this = this;
  this._action = 'select';
  this._limit = 1;
  return this.execute(this.builder(), this._params).then(function (result) {
    return result && result.length ? result[0] : {};
  }).catch(function (err) {
    return _this.reject(err.message);
  });
};

/**
 * 根据其他查询条件查询
 * 返回数据json
 * @purview Public
 * @param {String||Object} condition
 * @param {Function} func
 * @param {Object} params
 * @return {Object}
 */
Orm.prototype.find = function () {
  let _this = this;
  this._action = 'select';
  return this.beforeFind().then(function () {
    return _this.getCache('hgetall');
  }).then(function (data) {
    if (!validator.isEmpty(data)) return _this._record = data;
    return _this.getRecord().then(function (record) {
      _this._record = record;
      if (record.id && _this._cacheName) return _this.setCache(record, 'hmset');
      return true;
    });
  }).then(function () {
    return _this.afterFind();
  }).catch(function (err) {
    _this.addError(err.message);
    return {};
  });
};

/**
 * 根据主键查询
 * @purview Public
 * @param {Int} id
 * @param {Function} func
 * @return {Object}
 */
Orm.prototype.findByPk = function (id) {
  return this.where({id: Orm.eq(id)}).find();
};

/**
 * 查询数据，没有进行创建
 * 返回数据json或this
 * @purview Public
 * @param {String||Object} condition
 * @param {Object} params
 * @param {Boolean} [data]
 * @return {Object}
 */
Orm.prototype.findOrCreate = function (data) {
  let _this = this;
  return this.find().then(function (record) {
    if (record.id) return record;
    return _this.create(data).then(function (result) {
      if (false === result) return {};
      _this._conditionGroup = [];
      return _this.master().findByPk(result.id);
    });
  });
};

/**
 * 查找后创建或更新
 * 如果有记录，进行更新
 * 返回数据json或this
 * @purview Public
 * @param {Object} [data]
 * @return {Promise}
 */
Orm.prototype.createOrUpdate = function (data) {
  let _this = this;
  return this.find().then(function (record) {
    if (!record || !record.id) {
      return _this.create(data);
    } else {
      return _this.update(data);
    }
  });
};

/**
 * 创建或删除
 * 成功返回新添加的数据对象，删除返回空对象
 * @purview Public
 * @param {String||Object} condition
 * @param {Object} params
 * @param {Boolean} [data]
 * @return {Promise}
 */
Orm.prototype.createOrDelete = function (data) {
  let _this = this;
  return this.getRecord().then(function (record) {
    if (validator.isEmpty(record)) {
      return _this.create(data);
    } else {
      _this._record = record;
      return _this.delete();
    }
  });
};

/**
 * 分页统计
 * @purview Public
 * @param {String} join
 * @return {Object}
 */
Orm.prototype.removeJoin = function () {
  this._join = '';
  return this;
};

/**
 * 统计详情
 * @purview Public
 * @param {String} join
 * @return {Promise}
 */
Orm.prototype.counts = function (options) {
  let _this = this;
  this._action = 'count';
  if (options) this._counts.options = options;
  return this.execute(this.builder(), this._params).then(function (records) {
    let count = 0;
    if(records.length){
      count = (_this._group !== '' && _this._group !== undefined) ? records.length : records[0].count;
    }
    _this._counts.page = _this._page;
    _this._counts.per_page = _this._per_page;
    _this._counts.total_items = count;
    _this._counts.total_page = count > 0 && _this._per_page > 0 ? (Math.ceil(count / _this._per_page)) : 0;
    if (_this._counts.options.sums && _this._counts.options.sums.length) {
      for (let sum of _this._counts.options.sums) {
        _this._counts[sum.name] = records.length && records[0][sum.name] ? records[0][sum.name] : 0;
      }
    }
    delete _this._counts.options;
    return _this._counts;
  });
};

/**
 * 查询一组数据
 * @purview Public
 * @param {String} join
 * @return {Object}
 */
Orm.prototype.findAll = function () {
  let _this = this;
  this._action = 'select';
  if (this._limit == 0) return [];
  return this.beforeFind().then(function () {
    return _this.getCache('get');
  }).then(function (records) {
    if (!validator.isEmpty(records)) return records;
    return _this.execute(_this.builder(), _this._params).then(function (records) {
      if (_this._cacheName && records.length) _this.setCache(records, 'set');
      return records;
    });
  }).then(function (records) {
    _this._records = records;
    return _this.afterFindAll();
  }).catch(function (err) {
    _this.addError(err.message);
    return [];
  })
};

/**
 * 获取查询对象指定字段集合
 * @purview Public
 * @param {String} join
 * @return {Promise(Array)}
 */
Orm.prototype.findIds = function (field) {
  let _this = this;
  this._action = 'select';
  return this.order('t.id ASC').limit(3000).findAll().then(function (records) {
    return records.map(function (r) {
      return field ? parseInt(r[field]) : parseInt(r.id);
    });
  }).catch(function (err) {
    _this.addError(err.message);
    return [];
  });
};

//调用mysql查询方法
Orm.prototype.execute = function (query, params) {
  let _this = this;
  if (!this.getConn()) {
    debug('未指定数据库连接'.red);
    return this.addError('未指定数据库连接');
  }

  return new Promise(function (resolve, reject) {
    let _query = _this.getConn().query(query, params, function (err, rows) {
      if (err) {
        debug('数据库查询错误 errno：%s'.red, err.errno);
        debug('%s'.red, err.message);
        debug('%s'.red, _query.sql);
        err.message += '<br>' + _query.sql;
        monitor.sendApiError('lib.orm执行错误', err);
        let message = mysqlErrno[err.errno] ? mysqlErrno[err.errno] : '数据库查询或处理失败(' + err.errno + ')';
        reject(new Error(message));
      } else {
        debugQuery(_query.sql);
        resolve(rows);
      }
    });
  });
};

//直接执行查询
//暂时缓存可能有问题
Orm.prototype.query = function (query) {
  let _this = this;
  this._action = 'execute';
  let params = arguments[1] ? arguments[1] : [];
  return this.getCache('get').then(function (records) {
    if (!validator.isEmpty(records)) return records;
    return _this.execute(query, params).then(function (records) {
      if (records.length && _this._cacheName) _this.setCache(records, 'set');
      return records;
    }).then(function (records) {
      _this._records = records;
      return _this.afterFindAll();
    })
  });
};

/**
 * 总数统计
 * @purview Public
 * @param {String} join
 * @return {Promise}
 */
Orm.prototype.count = function () {
  let _this = this;
  this._action = 'count';
  return this.beforeFind().then(function () {
    return _this.getCache('get');
  }).then(function (count) {
    if (!validator.isEmpty(count)) return count;
    return _this.execute(_this.builder(), _this._params).then(function (records) {
      let count = records.length ? records[0]['count'] : 0;
      if (_this._cacheName) _this.setCache(count, 'set');
      return count;
    })
  });
};

/**
 * 总数统计
 * @purview Public
 * @return {Promise}
 */
Orm.prototype.sum = function () {
  let _this = this;
  this._action = 'sum';
  return this.beforeFind().then(function () {
    return _this.getCache('get');
  }).then(function (count) {
    if (!validator.isEmpty(count)) return count;
    return _this.execute(_this.builder(), _this._params).then(function (records) {
      let count = records.length ? records[0]['sum'] : 0;
      if (_this._cacheName) _this.setCache(count, 'set');
      return count;
    });
  });
};

/**
 * 判断是否存在
 * @purview Public
 * @return {Promise}
 */
Orm.prototype.isExist = function () {
  return this.count().then(function (count) {
    return count ? true : false;
  })
};

//从已设置字段中过滤除系统禁用字段外其他字段
Orm.prototype.filterAttributes = function (keys) {
  for (let key of keys) {
    this._save.hasOwnProperty(key) && delete this._save[key];
  }
};

/**
 * 设置添加
 * 未设置attribute对象输入字段全部接受
 * @purview Public
 * @param {String} key
 * @return {String|Number} value
 */
Orm.prototype.setAttribute = function (key, value) {
  if (this._attribute === null || this._attribute.hasOwnProperty(key)) {
    value = validator.trim(value);
    if (key.indexOf('is_') >= 0) {
      if (validator.isInt(value)) {
      } else if (validator.isBoolean(value)) {
        value = validator.toBoolean(value) ? 1 : 0;
      } else {
        value = 0;
      }
    } else if (key.indexOf('_amount') >= 0 || key === 'amount') {
      value = parseInt(value * 100);
    } else if (key.indexOf('_date') >= 0 || key.indexOf('birthday') >= 0) {
      if (!validator.isDate(value)) {
        value = '0000-00-00';
      }
    } else if (key.indexOf('_at') >= 0 || key.indexOf('_time') >= 0) {
      if (!validator.isTime(value)) {
        value = '0000-00-00 00:00:00';
      }//int类型字段传“”会报错，临时强制转换
    } else if (validator.isIn(key, ['jpush_id', 'org_id', 'file_id', 'attachments_ids'])) {
      value = lib.textFilter(value);
    } else if (/(_id|_num|_year)$/.test(key)) {
      value = validator.isNumeric(value) ? validator.toInt(value) : 0;
    } else {//文本类型过滤标签,富文本保留标签
      value = ['content', 'body', 'html', 'style', 'modules', 'layout', 'html_template'].indexOf(key) >= 0 ? lib.richTextFilter(value) : lib.textFilter(value);
    }
    this._save[key] = value;
  }//设置外键字段
  else if (this._foreignAttrs.hasOwnProperty(key)) {
    value = ['content', 'body', 'html'].indexOf(key) >= 0 ? lib.richTextFilter(value) : lib.textFilter(value);
    this._foreignAttrs[key] = value;
  } else {
    debug('字段%s设置无效'.gray, key);
  }
  return this;
};

/**
 * 设置添加或保存原始数据
 * 自动过滤系统字段
 * @purview Public
 * @param {Object||String} join
 * @return {Object}
 */
Orm.prototype.setAttributes = function (data) {
  if (typeof(data) === 'string' && arguments[1]) {
    this.setAttribute(data, arguments[1]);
  } else if (typeof(data) === 'object' && Object.keys(data).length) {
    for (let key of Object.keys(data)) {
      if (['id', 'created_at', 'update_at', 'is_closed'].indexOf(key) < 0) {
        this.setAttribute(key, data[key]);
      }
    }
  }
  return this;
};

/**
 * 插入数据
 * 成功返回新插入数据，失败返回false
 * @purview Public
 * @param {Object} data
 * @return {Promise}
 */
Orm.prototype.create = function (data) {
  let _this = this;
  this._action = 'insert';
  _this.setAttributes(data);
  return this.beforeCreate().then(function () {
    return _this._isValidate ? _this.validator() : true;
  }).then(function () {
    if (!Object.keys(_this._save).length) return Promise.reject(new Error("添加数据不能为空"));
    let sql = 'INSERT INTO ' + _this.getTableName() + ' SET ?';
    return _this.execute(sql, _this._save);
  }).then(function (result) {
    if (result.insertId) {
      _this._record = lib.extend({id: result.insertId}, _this._save);
      return _this.afterCreate();
    } else {
      return Promise.reject(new Error('数据添加失败'));
    }
  }).catch(function (err) {
    _this.addError(err.message);
    return false;
  });
};

/**
 * 修改激活记录
 * 成功返回修改结果数据，失败返回false
 * affectedRows=0但foreignAttrs可能有变化，因此还需执行后续操作
 * @purview Public
 * @return {Promise}
 */
Orm.prototype.save = function (data) {
  let _this = this;
  this._action = 'update';
  if (!this._record.id) {
    return this.addError('修改对象不能为空');
  }
  this.setAttributes(data);
  if (!Object.keys(this._save).length) {
    return this.addError('修改数据不能为空');
  }
  return this.beforeSave().then(function () {
    let fields = [];
    let params = [];
    for (let key of Object.keys(_this._save)) {
      fields.push(key + '=?');
      params.push(_this._save[key]);
      _this._record[key] = _this._save[key];
    }
    let query = 'UPDATE ' + _this.getTableName();
    query += params.length ? ' SET ' + fields.join(',') : '';
    query += ' WHERE id=' + _this._record.id;
    return _this.execute(query, params);
  }).then(function () {
    debug('记录 %d 更新成功'.cyan, _this._record.id);
    return _this.afterSave().then(function () {
      return 1;
    });
  }).catch(function (err) {
    _this.addError(err.message);
    return false;
  })
};

/**
 * 先查询后修改，触发事件
 * 成功返回修改结果数据，失败返回false
 * @purview Public
 * @param {Object} data
 * @return {Object}
 */
Orm.prototype.update = function (data) {
  let _this = this;
  this.setAttributes(data);
  if (!this.getCondition()) {
    return this.addError('未指定任何查询条件');
  } else if (!Object.keys(this._save).length) {
    return this.addError('未修改任何内容');
  }
  //获取记录
  return this.getRecord().then(function (record) {
    if (!record.id) return _this.addError('记录不存在或已被删除');
    _this._action = 'update';
    _this._record = record;
    return _this._record;
  }).then(function () {
    return _this.beforeSave();
  }).then(function () {
    return _this.validator();
  }).then(function () {
    let fields = [];
    let params = [];
    for (let key of Object.keys(_this._save)) {
      fields.push(_this._alias + '.' + key + '=?');
      params.push(_this._save[key]);
      _this._record[key] = _this._save[key];
    }
    let query = 'UPDATE ' + _this.getAliseTableName();
    query += params.length ? ' SET ' + fields.join(',') : '';
    query += ' WHERE ' + _this._alias + '.id=' + _this._record.id;
    params = params.concat(_this._params);
    return _this.execute(query, params);
  }).then(function () {
    debug('记录 %d 更新成功'.cyan, _this._record.id);
    return _this.afterSave().then(function () {
      return 1;
    });
  }).catch(function (err) {
    _this.addError(err.message);
    return false;
  });
};

/**
 * 批量修改信息记
 * 成功返回影响的记录数，失败返回false
 * @purview Public
 * @param {Object} data
 * @return {Promise}
 */
Orm.prototype.updateAll = function (data) {
  let _this = this;
  this.setAttributes(data);
  if (!this.getCondition()) {
    this.addError('请指定条件');
    return Promise.resolve(false);
  } else if (!Object.keys(this._save).length) {
    this.addError('修改内容不能为空');
    return Promise.resolve(false);
  }
  this._action = 'update';
  return this.validator().then(function () {
    let fields = [];
    let params = [];
    for (let key of Object.keys(_this._save)) {
      fields.push(_this._alias + '.' + key + '=?');
      params.push(_this._save[key]);
    }
    let query = 'UPDATE ' + _this.getAliseTableName();
    query += params.length ? ' SET ' + fields.join(',') : '';
    query += _this.getCondition();
    params = params.concat(_this._params);
    return _this.execute(query, params).then(function (result) {
      return result['affectedRows'];
    }).then(function (affectedRows) {
      debug('更新 %d 条记录'.cyan, affectedRows);
      return affectedRows;
    }).catch(function () {
      return Promise.reject(new Error('数据更新失败'));
    });
  }).catch(function (err) {
    _this.addError(err.message);
    return false;
  });
};

/**
 * 删除当前激活状态记录
 * 只能在getRecord后使用
 * 触发beforeDelete和afterDelete事件
 * 成功返回影响的记录数
 * @purview Public
 * @return {Promise}
 */
Orm.prototype.delete = function () {
  let _this = this;
  this._action = 'update';
  if (!this._record.id) {
    this.addError('未激活任何记录');
    return this.addError('未激活任何记录');
  }
  return this.beforeDelete().then(function () {
    let query = 'UPDATE ' + _this.getTableName() + ' SET is_deleted=1 WHERE id=' + _this._record.id;
    return _this.execute(query);
  }).then(function (result) {
    if (!result['affectedRows']) return 0;
    return _this.afterDelete().then(function () {
      return 1;
    });
  }).then(function (affectedRows) {
    if (!affectedRows) {
      debug('未删除任何记录'.cyan);
    } else {
      debug('成功删除记录 %d'.cyan, _this._record.id);
    }
    return affectedRows;
  }).catch(function (err) {
    _this.addError(err.message);
    debug('记录 %d 软删除失败 %s'.red, _this._record.id, _this.getError());
    return false;
  });

};

/**
 * 删除当前记录激活状态记录, 育金表使用
 * 只能在getRecord后使用
 * 触发beforeDelete和afterDelete事件
 * 成功返回影响的记录数
 * @purview Public
 * @return {Promise}
 */
Orm.prototype.deleteUD = function () {
  let _this = this;
  this._action = 'delete';
  if (!this._record.id) {
    this.addError('未激活任何记录');
    return this.addError('未激活任何记录');
  }

  return this.beforeDelete().then(function () {
    let query = 'DELETE FROM ' + _this.getTableName() + ' WHERE id=?'
    return _this.execute(query, _this._record.id);
  }).then(function (result) {
    if (!result['affectedRows']) return 0;
    return _this.afterDelete().then(function () {
      return 1;
    });
  }).then(function (affectedRows) {
    if (!affectedRows) {
      debug('未删除任何记录'.cyan);
    } else {
      debug('成功删除记录 %d'.cyan, _this._record.id);
    }
    return affectedRows;
  }).catch(function (err) {
    _this.addError(err.message);
    debug('记录 %d 删除失败 %s'.red, _this._record.id, _this.getError());
    return false;
  });
};

/**
 * 批量删除记录, 育金表使用
 * 触发beforeDelete和afterDelete事件
 * 成功返回影响的记录数
 * @purview Public
 * @return {Promise}
 */
Orm.prototype.deleteAllUD = function () {
  let _this = this;
  this._action = 'delete';

  if (!this.getCondition()) {
    return this.addError('未指定任何查询条件');
  }

  return this.beforeDelete().then(function () {
    let query = 'DELETE FROM ' + _this.getTableName() + _this.getCondition()
    return _this.execute(query);
  }).then(function (result) {
    return result.affectedRows || 0;
  }).catch(function (err) {
    _this.addError(err.message);
    return false;
  });
};

/**
 * 批量删除
 * 必须指定至少一个条件
 * 不会触发beforeDelete和afterDelete事件
 * 成功返回影响的记录数，失败返回false
 * @purview Public
 * @return {Promise}
 */
Orm.prototype.deleteAll = function () {
  let _this = this;
  this._action = 'update';
  if (!this.getCondition()) {
    return this.addError('未指定任何删除条件');
  }
  this._save['is_deleted'] = 1;
  let fields = [];
  let params = [];
  for (let key of Object.keys(this._save)) {
    fields.push(this._alias + '.' + key + '=?');
    params.push(this._save[key]);
    this._record[key] = this._save[key];
  }
  let query = 'UPDATE ' + this.getAliseTableName();
  query += params.length ? ' SET ' + fields.join(',') : '';
  query += this.getCondition();
  params = params.concat(this._params);
  return this.execute(query, params).then(function (result) {
    return result.affectedRows || 0;
  }).catch(function (err) {
    _this.addError(err.message);
    return Promise.resolve(0);
  });
};

//获取表结构
Orm.prototype.getStructure = function () {
  return this.execute('show columns from ' + this.getTableName()).then(function (records) {
    return records;
  });
};

//清空表表所有数据并重置起始ID
Orm.prototype.emptyTable = function () {
  return this.execute('TRUNCATE TABLE ' + this.getTableName()).then(function (result) {
    debug('重置表 TRUNCATE TABLE %s'.red, this.getTableName());
    return this;
  });
};

//各类查询表达式
Orm.eq = function (value) {
  value = typeof(value) === 'undefined' ? '-1' : value;
  return '="' + lib.safeFilter(value) + '"';
};
Orm.ne = function (value) {
  value = typeof(value) === 'undefined' ? '-1' : value;
  return '!="' + lib.safeFilter(value) + '"';
};
Orm.gt = function (value) {
  value = validator.isNumeric(value) || validator.isDate(value) ? value : 1;
  return '>"' + value + '"';
};
Orm.gte = function (value) {
  value = validator.isNumeric(value) || validator.isDate(value) ? value : 1;
  return '>="' + value + '"';
};
Orm.lt = function (value) {
  value = validator.isNumeric(value) || validator.isDate(value) ? value : 1;
  return '<"' + value + '"';
};
Orm.lte = function (value) {
  value = validator.isNumeric(value) || validator.isDate(value) ? value : 1;
  return '<="' + value + '"';
};
Orm.like = function (value) {
  value = typeof(value) === 'undefined' ? '-1' : value;
  return ' LIKE "' + lib.safeFilter(value) + '"';
};
Orm.in = function (value) {
  value = lib.safeFilter(value);
  value = validator.isArray(value) && value.length && value[0] !== '' ? value : [-1];
  return ' IN ("' + value.join('","') + '")';
};
Orm.notin = function (value) {
  value = lib.safeFilter(value);
  value = validator.isArray(value) && value.length && value[0] !== '' ? value : [-1];
  return ' NOT IN (' + value.join(',') + ')';
};

module.exports = Orm;
