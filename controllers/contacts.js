'use strict';
const Orm = require('../lib/orm');
const Contacts = require('../models/mongo/contacts');

exports.contacts = async (ctx) => {
  let model = Contacts.factory();
  model.where({bind_user_id: ctx.uid});
  model.addWhere(ctx.query);
  let result = await model.findAll();
  ctx.data.result = result;
}

exports.groupList = async (ctx) => {
  let model = ctx.model('userContactsGroup');
  model.where({user_id: Orm.eq(ctx.uid)});
  ctx.data.result = await model.limit(50).findAll();
}