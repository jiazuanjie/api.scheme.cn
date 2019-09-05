'use strict';
const Orm = require('../lib/orm');

exports.list = async (ctx, next) => {
  let model = ctx.model('support');
  let records = await model.order('amount desc').limit(10).findAll();
  ctx.data.result = records;
};