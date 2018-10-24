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

  return model;
}