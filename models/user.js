const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/user');
const PropertyChecker = require('../lib/propertyChecker');

exports.factory = function() {
  let model = new Orm('user', fields);

  model.beforeCreate = function() {
    if (this._save.password && this._save.password.length != 32) {
      this._save.password = lib.password(this._save.password);
    }
    return Promise.resolve(true)
  };

  model.beforeSave = function() {
    if (this._save.password && this._save.password.length != 32) {
      this._save.password = lib.password(this._save.password);
    }
    return Promise.resolve(true)
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
    if (this._save.hasOwnProperty('name') && validator.isEmpty(this._save.name)) {
      return this.reject('姓名不能为空');
    } else if (this._save.hasOwnProperty('name') && !validator.isLength(this._save.name, 2, 25)) {
      return this.reject('姓名长度不能小于2个或大于25个文字');
    } else if (this._save.hasOwnProperty('sex') && !validator.isIn(this._save.sex, [0, 1, 2, 3])) {
      return this.reject('性别填写错误');
    } else if (this._save.hasOwnProperty('birthday') && !validator.isDate(this._save.birthday)) {
      return this.reject('生日格式错误');
    } else if (this._save.hasOwnProperty('password') && this._save.password.length != 32) {
      return this.reject('密码加密错误');
    }

    return this.resolve(true);
  };

  return model.init();
};
