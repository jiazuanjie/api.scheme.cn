'use strict';
var ObjectID = require('mongodb').ObjectID;
var debug = require('debug')('mquery');

//mongo查询简单封装

var Mquery = function (db) {
  this._conn = db;
  this._limit = 15;
  this._error = '';
  this._page = 1;
  this._order = {_id: 1};
  this._per_page = 15;
  this._condition = {};
  this._select = {};
  this._save = {};
  this._fields = [];
  this._collection = null;
}

/**
 * 指定数据库连接
 * @purview public
 * @param {Object} conn
 * @return {Object}
 */
Mquery.prototype.setConn = function (conn) {
  this._conn = conn;
  return this;
}

/**
 * 返回当前数据库连接
 * @purview public
 * @param {Object} conn
 * @return {Object}
 */
Mquery.prototype.getConn = function () {
  return this._conn;
}

/**
 * 动态指定客户端有效字段
 * @purview public
 * @param {Array} list
 * @return {Object}
 */
Mquery.prototype.safeFields = function (list) {
  this._fields = list;
  return this;
}

/**
 * 指定集合名称
 * @purview public
 * @param {String} name
 * @return {Object}
 */
Mquery.prototype.coll = function (name) {
  this._collection = name;
  return this;
}

/**
 * 查询字段
 * @purview public
 * @param {Object} select
 * @return {Object}
 */
Mquery.prototype.select = function (select) {
  if (typeof select === 'object' && Object.keys(select).length) {
    this._select = select;
  }
  return this;
}

/**
 * 添加错误并返回false
 * @purview Public
 * @param {String} error
 * @return false
 */
Mquery.prototype.addError = function (error) {
  this._error = error;
  return false;
}

//返回活动记录
Mquery.prototype.getError = function () {
  return this._error;
}

//返回错误Promise
Mquery.prototype.reject = function (error) {
  this._error = error;
  return Promise.reject(new Error(error));
}

Mquery.prototype.resolve = function (record) {
  return Promise.resolve(record);
}

//添加验证
Mquery.prototype.beforeCreate = function () {
  if (this._error) {
    return Promise.reject(new Error(this._error));
  } else {
    return Promise.resolve(true);
  }
}

//更新验证
Mquery.prototype.beforeSave = function () {
  if (this._error) {
    return Promise.reject(new Error(this._error));
  } else {
    return Promise.resolve(true);
  }
}

//通用验证
Mquery.prototype.validator = function () {
  return Promise.resolve(true);
}

/**
 * 获取常用参数
 * @purview public
 * @param {Object} select
 * @return {Object}
 */
Mquery.prototype.addWhere = function (options) {
  if (!options || typeof(options) != 'object') return this;
  if (validator.isPosInt(options.per_page)) {
    this.perPage(options.per_page);
  }
  if (validator.isPosInt(options.page)) {
    this.page(options.page)
  }
  if (validator.isPosInt(options.limit)) {
    this.limit(options.limit)
  }
  return this;
}


/**
 * 设置显示页码
 * @purview public
 * @param {Number} limit
 * @param {Number} limit
 * @return {Object}
 */
Mquery.prototype.page = function (value) {
  this._page = validator.isPosInt(value) ? parseInt(value) : this._page;
  return this;
}

/**
 * 指定每页显示条数
 * @purview public
 * @param {Number} offset
 * @param {Number} limit
 * @return {Object}
 */
Mquery.prototype.perPage = function (value) {
  this._per_page = validator.isPosInt(value) ? parseInt(value) : this._page;
  this.limit(value);
  return this;
}

/**
 * 限定查询条数
 * @purview public
 * @param {Number} offset
 * @param {Number} limit
 * @return {Object}
 */
Mquery.prototype.limit = function (value) {
  this._limit = validator.isPosInt(value) ? parseInt(value) : this._limit;
  return this;
}

/**
 * 设置查询条件
 * @purview Public
 * @param {Object} condition
 * @param {Array} [params] 数组参数
 * @return {Object}
 */
Mquery.prototype.where = function (condition) {
  if (typeof condition === 'object' && Object.keys(condition).length) {
    this._condition = Object.assign({}, this._condition, condition);
  }
  return this;
}

/**
 * 设置排序
 * @purview public
 * @param {String} order
 * @return {Object}
 */
Mquery.prototype.order = function (order) {
  this._order = (typeof order === 'object') ? order : this._order;
  return this;
}

/**
 * 获取最终查询条件
 * @purview public
 * @return {Object}
 */
Mquery.prototype.getCondition = function () {
  Object.keys(this._condition).map(key => {
    if (typeof(this._condition[key]) === 'string') {
      this._condition[key] = this._condition[key].trim();
    }
  });
  return this._condition;
}

/**
 * 查询单条数据
 * @purview public
 * @param {Object} condition
 * @return {Object}
 */
Mquery.prototype.find = function () {
  let _this = this;
  debug(`查询:db.${this._collection}.findOne(${JSON.stringify(this.getCondition())},${JSON.stringify(this._select)}).sort(${JSON.stringify(_this._order)})`.green);
  return new Promise(function (resolve, reject) {
    _this._conn.collection(_this._collection).findOne(_this.getCondition() || {}, {fields: _this._select}, function (err, record) {
      if (err) return reject(err);
      resolve(_this.afterFind(record ? record : {}));
    });
  }).catch(function (err) {
    debug('mongo查询错误:' + err.message.red);
    return {};
  });
}

Mquery.prototype.drop = function () {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this._conn.collection(_this._collection).drop(function (err, result) {
      if (err) return reject(err);
      resolve(result);
    })
  });
}

/**
 * 查询多条数据
 * @purview public
 * @param {Object} condition
 * @return {Array}
 */
Mquery.prototype.findAll = function () {
  let _this = this;
  let skip = (this._page - 1) * this._per_page;
  debug(`批量查询:db.${this._collection}.find(${JSON.stringify(this.getCondition())},${JSON.stringify(this._select)}).sort(${JSON.stringify(_this._order)}).skip(${skip}).limit(${this._limit})`.green);
  return new Promise(function (resolve, reject) {
    _this._conn.collection(_this._collection).find(_this.getCondition() || {}, _this._select || {}).sort(_this._order).skip(skip).limit(_this._limit).toArray(function (err, records) {
      if (err) return reject(err);
      resolve(_this.afterFindAll(records ? records : []));
    });
  }).catch(function (err) {
    debug('mongo查询错误:' + err.message.red);
    debug('错误追踪：%s'.red, err.stack);
    return [];
  });
}

/**
 * 根据逐渐查询
 * @purview public
 * @param {Object} condition
 * @return {Object}
 */
Mquery.prototype.findByPk = function (id) {
  if (!id) return Promise.resolve({});
  return this.where({_id: new ObjectID(id)}).find();
}

/**
 * 单条记录查询结果
 * @purview public
 * @param {Object} record
 * @return {Object}
 */
Mquery.prototype.afterFind = function (record) {
  return record;
}

/**
 * 多条记录查询结果
 * @purview public
 * @param {Array} records
 * @return {Array}
 */
Mquery.prototype.afterFindAll = function (records) {
  return records;
}

/**
 * 统计
 * @purview Public
 * @param {String} join
 * @return {Promise}
 */
Mquery.prototype.count = function () {
  let _this = this;
  debug(`查询:db.${this._collection}.count(${JSON.stringify(this.getCondition())})`.green);
  return new Promise(function (resolve, reject) {
    _this._conn.collection(_this._collection).count(_this.getCondition() || {}, function (err, count) {
      return err ? reject(err) : resolve(count);
    });
  }).catch(function (err) {
    debug('mongo统计错误:' + err.message.red);
    return 0;
  })
}

/**
 * 统计详情
 * @purview Public
 * @param {String} join
 * @return {Promise}
 */
Mquery.prototype.counts = function () {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this._conn.collection(_this._collection).count(_this.getCondition() || {}, function (err, count) {
      if (err) return reject(err);
      resolve({
        page: _this._page,
        per_page: _this._per_page,
        total_items: count,
        total_page: count > 0 && _this._per_page > 0 ? (Math.ceil(count / _this._per_page)) : 0
      });
    });
  }).catch(function (err) {
    debug('mongo统计错误:' + err.message.red);
    return {};
  });
}

/**
 * 设置保存字段值
 * @purview Public
 * @param {String} join
 * @return {Promise}
 */
Mquery.prototype.setAttributes = function (data) {
  if (!data) return this;
  for (let key of Object.keys(data)) {
    if (this._fields.indexOf(key) > -1 || this._fields.length == 0) {
      this.setAttribute(key, data[key])
    }
  }
  return this;
}

/**
 * 设置添加
 * 保证原始值类型不变
 * @purview Public
 * @param {String} key
 * @return {String|Number} value
 */
Mquery.prototype.setAttribute = function (key, value) {
  if (typeof(value) === 'string') {
    value = ['content', 'body', 'html'].indexOf(key) >= 0 ? lib.richTextFilter(value) : lib.textFilter(value.trim());
  }
  this._save[key] = value;
  return this;
}

/**
 * 添加单挑记录
 * @purview Public
 * @param {Object} data
 * @return {Promise}
 */
Mquery.prototype.create = function (data) {
  let _this = this;
  _this._save['created_at'] = lib.datetime();
  _this._save['update_at'] = lib.datetime();
  this.setAttributes(data);
  return this.beforeCreate().then(() => {
    return _this.validator();
  }).then(() => {
    return new Promise(function (resolve, reject) {
      debug(`插入:db.${_this._collection}.insertOne(${JSON.stringify(_this._save)},{safe: true})`.green);
      _this._conn.collection(_this._collection).insertOne(_this._save, {safe: true}, function (err, result) {
        if (err) return reject(err);
        if (result.result.ok && result.ops.length) {
          debug('记录添加成功'.green);
          debug(JSON.stringify(result.ops).green);
          resolve(result.ops[0]);
        } else {
          reject(new Error("记录插入失败"));
        }
      });
    })
  }).catch(function (err) {
    debug('mongo添加错误:' + err.message.red);
    _this.addError(err.message);
    return false;
  });
}

/**
 * 更新单条记录
 * 记录不存在不自动添加
 * @purview Public
 * @return {Promise}
 */
Mquery.prototype.update = function (data, type = false) {
  let _this = this;
  if(!type) {
    _this._save['update_at'] = lib.datetime();
    this.setAttributes(data);
    data = {$set: _this._save};
  }else if(type){
    if(data.hasOwnProperty('$set')) {
      data['$set']['update_at'] = lib.datetime();
    }else{
      data['$set'] = {'update_at': lib.datetime()};
    }
  }
  return this.beforeSave().then(() => {
    return _this.validator();
  }).then(function () {
    return new Promise(function (resolve, reject) {
      if (!Object.keys(_this.getCondition()).length) return reject(new Error('未指定任何更新条件'));
      debug(`更新:db.${_this._collection}.updateOne(${JSON.stringify(_this.getCondition())},${JSON.stringify(data)},{safe: true,upsert: false})`.cyan);
      _this._conn.collection(_this._collection).updateOne(_this.getCondition(), data, {
        safe: true,
        upsert: false
      }, function (err, result) {
        if (err) return reject(err);
        if (result.result.ok == 1 && !result.result.nModified) {
          debug('未做任何修改'.green);
          resolve(result.modifiedCount);
        } else if (result.result.ok == 1 && result.result.nModified) {
          debug('单条记录更新成功'.green);
          resolve(result.modifiedCount);
        } else {
          reject(new Error("单条记录更新失败"));
        }
      });
    })
  }).catch(function (err) {
    debug('mongo更新错误:' + err.message.red);
    _this.addError(err.message);
    return false;
  });
}

/**
 * 更新多条记录
 * @purview Public
 * @return {Promise}
 */
Mquery.prototype.updateAll = function () {
  let _this = this;
  return new Promise(function (resolve, reject) {
    if (!Object.keys(_this.getCondition()).length) return reject(new Error('未指定任何更新条件'));
    debug(`批量更新:db.${_this._collection}.updateMany(${JSON.stringify(_this.getCondition())},{$set: ${JSON.stringify(_this._save)}},{safe: true,upsert: false})`.cyan);
    _this._conn.collection(_this._collection).updateMany(_this.getCondition(), {$set: _this._save}, {
      safe: true,
      upsert: false
    }, function (err, result) {
      if (err) return reject(err);
      if (result.result.ok) {
        debug('多条记录更新成功'.green);
        debug(JSON.stringify(result.result).green);
        resolve(result.result.nModified);
      } else {
        reject(new Error("多条记录更新失败"));
      }
    });
  }).catch(function (err) {
    debug('mongo更新错误:' + err.message.red);
    _this.addError(err.message);
    return false;
  });
}

/**
 * 删除单条记录
 * @purview Public
 * @return {Promise}
 */
Mquery.prototype.delete = function () {
  let _this = this;
  return new Promise(function (resolve, reject) {
    if (!Object.keys(_this.getCondition()).length) return reject(new Error('未指定任何删除条件'));
    debug(`单个删除:db.${_this._collection}.deleteOne(${JSON.stringify(_this.getCondition())},{safe: true})`.red);
    _this._conn.collection(_this._collection).deleteOne(_this.getCondition(), {safe: true}, function (err, result) {
      if (err) return reject(err);
      if (result && result.result.ok) {
        debug('多条记录删除成功'.green);
        debug(JSON.stringify(result.result).green);
        resolve(result['deletedCount']);
      } else {
        reject(new Error("单条记录删除失败"));
      }
    });
  }).catch(function (err) {
    debug('mongo删除错误:' + err.message.red);
    _this.addError(err.message);
    return false;
  });
}

/**
 * 删除多记录
 * @purview Public
 * @return {Promise}
 */
Mquery.prototype.deleteAll = function () {
  let _this = this;
  return new Promise(function (resolve, reject) {
    if (!Object.keys(_this.getCondition()).length) return reject(new Error('未指定任何删除条件'));
    debug(`批量删除:db.${_this._collection}.deleteMany(${JSON.stringify(_this.getCondition())},{safe: true})`.red);
    _this._conn.collection(_this._collection).deleteMany(_this.getCondition(), {safe: true}, function (err, result) {
      if (err) return reject(err);
      if (result && result.result.ok) {
        debug('多条记录删除成功'.green);
        debug(JSON.stringify(result.result).green);
        resolve(result['deletedCount']);
      } else {
        reject(new Error("多条记录删除失败"));
      }
    });
  }).catch(function (err) {
    debug('mongo删除错误:' + err.message.red);
    _this.addError(err.message);
    return false;
  });
}

exports.factory = function (db) {
  return new Mquery(db);
}

//生成mongodb对象ID
exports.ObjectId = function (id) {
  try {
    return new ObjectID(id)
  } catch (err) {
    return id
  }
}
