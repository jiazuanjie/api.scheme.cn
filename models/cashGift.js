const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/cashGift');
const PropertyChecker = require('../lib/propertyChecker');

exports.factory = function() {
  let model = new Orm('cash_gift', fields);

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
      return this.reject('礼单名称不能为空');
    } else if (!validator.isLength(this._save.name, 2, 10)) {
      return this.reject('礼单名称字符数为2~10')
    } else if (!this._save.hasOwnProperty('classify') || !validator.isIn(this._save.classify, [0, 1])) {
      return this.reject('礼单类型选择错误')
    } else if (!this._save.hasOwnProperty('type_id') || !validator.isPosInt(this._save.type_id)) {
      return this.reject('礼单所属分类不能为空')
    } else if (!this._save.hasOwnProperty('user_id') || !validator.isPosInt(this._save.user_id)) {
      return this.reject('礼单绑定用户失败')
    }


    return this.resolve(true);
  };

  model.joinCategory = function () {
      this.addSelect('cate.name as cate_name');
      this.join('LEFT JOIN cash_gift_category cate ON cate.id = t.type_id');
      return this;
  }

  return model.init();
};
