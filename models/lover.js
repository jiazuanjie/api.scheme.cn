const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/lover');
const PropertyChecker = require('../lib/propertyChecker');

exports.factory = function() {
  let model = new Orm('lover', fields);

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
    try {
      PropertyChecker(this._save, fields);
    } catch (err) {
      return this.reject(lib.getErrMessage(err));
    }

    return this.resolve(true);
  };

  return model.init();
};
