const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/piggyBank');

exports.factory = function() {
  let model = new Orm('piggy_bank', fields);

  model.beforeCreate = function() {
    if (!this._save.hasOwnProperty('start_date') || !validator.isDate(this._save.start_date)) {
      this._save.start_date = lib.datetime('Y-M-D')
    }
    return this.resolve(true);
  };

  const _addWhere = model.addWhere;
  model.addWhere = function(options) {
    options = Object.assign({}, options);

    _addWhere.call(this, options);

    for (let field in fields) {
      if (options.hasOwnProperty(field) && fields[field].is_filter) {
        this.where({[field]: Orm.eq(options[field])});
      }
    }
    return this;
  };

  model.validator = function() {
    if (this._save.hasOwnProperty('title') && validator.isEmpty(this._save.title)) {
      return this.reject('描述不能为空')
    } else if (this._save.hasOwnProperty('title') && !validator.isLength(this._save.title, 2, 16)) {
      return this.reject('描述字数只能2~16')
    } else if (this._save.hasOwnProperty('target_amount') && parseInt(this._save.target_amount) === 0) {
      return this.reject('目标金额不能为空')
    } else if (this._save.hasOwnProperty('type') && !validator.isIn(this._save.type, [1, 2, 3, 4])) {
      return this.reject('模式选择不正确')
    } else if (this._save.hasOwnProperty('target_date') && !validator.isDate(this._save.target_date)) {
      return this.reject('目标时间格式不正确')
    } else if (this._save.hasOwnProperty('is_finsh') && !validator.isIn(this._save.is_finsh, [0, 1])) {
      return this.reject('项目完成状态设置不正确')
    }

    return this.resolve(true);
  };

  return model.init();
};
