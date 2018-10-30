const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/account')

exports.factory = function() {
  let model = new Orm('account', fields);

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
    if (!this._save.hasOwnProperty('name') || validator.isEmpty(this._save.name)) {
      return this.reject('姓名不能为空')
    } else if (!validator.isLength(this._save.name, 2, 10)) {
      return this.reject('姓名字符只能2~10')
    } else if (!this._save.hasOwnProperty('classify') || !validator.isIn(this._save.classify, [0, 1])) {
      return this.reject('请选择类型')
    } else if (!this._save.hasOwnProperty('total_amount') || validator.isEmpty(this._save.total_amount)) {
      return this.reject('金额不能为空')
    }

    if (this._save.total_amount === this._save.repay_amount) {
      this._save.status = 1;
    } else {
      this._save.status = 0;
    }

    return this.resolve(true);
  };

  return model.init();
};
