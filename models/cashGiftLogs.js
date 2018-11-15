const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/cashGiftLogs');
const PropertyChecker = require('../lib/propertyChecker');

exports.factory = function() {
  let model = new Orm('cash_gift_logs', fields);

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
    if (!this._save.hasOwnProperty('project_id') || this._save.project_id == 0) {
      return this.reject('请选择礼单');
    } else if (!this._save.hasOwnProperty('user_id') || this._save.user_id == 0) {
      return this.reject('登录出错，请重新登录')
    } else if (this._save.hasOwnProperty('contact_id') && this._save.contact_id && !validator.isObjectId(this._save.contact_id)) {
      return this.reject('亲友关联失败')
    } else if (!this._save.hasOwnProperty('username') || validator.isEmpty(this._save.username)) {
      return this.reject('亲友姓名不能为空')
    } else if (!this._save.hasOwnProperty('amount') || validator.isEmpty(this._save.amount)) {
      return this.reject('金额不能为空')
    }

    return this.resolve(true);
  };

  return model.init();
};
