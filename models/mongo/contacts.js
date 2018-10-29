'use strict';
require('../../lib/common');
const mquery = require('../../lib/mquery');

exports.factory = function () {
  let model = mquery.factory('scheme').coll('contacts');

  model._fields = [
    'name',
    'nickname',
    'group_id',
    'sex',
    'avatar_path',
    'user_id',
    'bind_user_id',
    'mobile',
    'intimacy',
    'created_at',
    'update_at'
  ]

  model.validator = function () {
    if (!this._save.hasOwnProperty('name') || validator.isEmpty(this._save.name)) {
      return Promise.reject('姓名不能为空')
    } else if (!validator.isLength(this._save.name, 2, 10)) {
      return Promise.reject('姓名字符只能2~10')
    } else if (this._save.hasOwnProperty('nickname') && !validator.isLength(this._save.nickname, 2, 10)) {
      return Promise.reject('称呼字符只能2~10')
    }

    this._save.first_letter = lib.getFirstLetter(this._save.name).toUpperCase()

    return Promise.resolve(true);
  }

  return model;
}