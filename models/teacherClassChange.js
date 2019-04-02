const Orm = require('../lib/orm');
const lib = require('../lib/library.js');
const { fields } = require('./structure/teacherClassChange');
const PropertyChecker = require('../lib/propertyChecker');

exports.factory = function() {
  let model = new Orm('teacher_class_change', fields);

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
    if (this._save.hasOwnProperty('school_id') && validator.isEmpty(this._save.school_id)) {
      return this.reject('学校不能为空')
    } else if (this._save.hasOwnProperty('date') && !validator.isDate(this._save.date)) {
      return this.reject('时间格式不正确');
    } else if (this._save.hasOwnProperty('class_hour') && !validator.isPosInt(this._save.class_hour)) {
      return this.reject('课时选择不正确')
    } else if (this._save.hasOwnProperty('class_hour') && (parseInt(this._save.class_hour) < 1 || parseInt(this._save.class_hour) > 8)) {
      return this.reject('课时选择不正确')
    } else if (this._save.hasOwnProperty('classes') && validator.isEmpty(this._save.classes)) {
      return this.reject('班级不能为空')
    } else if (this._save.hasOwnProperty('lessons') && validator.isEmpty(this._save.lessons)) {
      return this.reject('课程不能为空')
    }

    return this.resolve(true);
  };

  return model.init();
};
