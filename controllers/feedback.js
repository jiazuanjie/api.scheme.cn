'use strict';
const Orm = require('../lib/orm');

exports.lists = async (ctx) => {
  let models = await ctx.model('feedback').where({user_id: Orm.eq(ctx.uid)}).findAll();
  ctx.data.items = models;
}

exports.create = async (ctx) => {
  const {content} = ctx.post;
  if (!content) {
    ctx.warning = '内容不能为空';
    return ;
  }
  let model = ctx.model('feedback');
  model.setAttribute('content', content);
  model.setAttribute('user_id', ctx.uid);
  let result = await model.create();
  if (!result) {
    ctx.warning = model.getError();
    return;
  }
  ctx.data.result = {affected: 1}
}
