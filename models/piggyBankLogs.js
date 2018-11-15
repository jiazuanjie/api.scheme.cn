const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/piggyBankLogs');

exports.factory = function() {
  let model = new Orm('piggy_bank_logs', fields);

  model.beforeCreate = function() {
    this._save = lib.parseFilter(this._save);
    let data = this._save;
    for (let field in fields) {
      if (!data.hasOwnProperty(field) && fields[field].required) {
        return this.reject(`${fields[field].description || field}不能为空`);
      }
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
    if (this._save.hasOwnProperty('amount') && parseInt(this._save.amount) === 0) {
      return this.reject('金额不能为空')
    } else if (this._save.hasOwnProperty('is_advance') && !validator.isIn(this._save.is_advance, [0, 1])) {
      return this.reject('记录方式不正确')
    }

    return this.resolve(true);
  };

  return model.init();
};
