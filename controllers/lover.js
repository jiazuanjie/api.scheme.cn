'use strict';
const Orm = require('../lib/orm');

exports.bindLover = async (ctx) => {
  const {bind_user_id} = ctx.post;
  if ([1, 2].indexOf(ctx.user.sex) === -1) {
    return ctx.warning = '请先设置性别';
  }
  let model = ctx.model('lover')
  if (ctx.user.sex === 1) {
    model.setAttributes({man_id: ctx.uid, woman_id: bind_user_id})
  } else if (ctx.user.sex === 2) {
    model.setAttributes({man_id: bind_user_id, woman_id: ctx.uid})
  }
  await model.create();
  if (model.getError()) {
    return ctx.warning = model.getError()
  }
  ctx.data.result = {affected: 1}
};

exports.manage = async (ctx, next) => {
  ctx.lover = await ctx.model('lover').where("man_id = ? or woman_id = ?", [ctx.uid, ctx.uid]).notClosed().find();
  if (!ctx.lover.id) {
    return ctx.warning = '恋爱的酸臭味不适合你'
  }
  ctx.partnerId = ctx.lover.man_id == ctx.uid ? ctx.lover.man_id : ctx.lover.woman_id;
  await next()
};

exports.view = async (ctx) => {
  ctx.partner = await ctx.model('user').findByPk(ctx.partner.id)
  ctx.data.result = {user: ctx.user, partner: ctx.partner, lover: ctx.lover}
}

exports.settingLover = async (ctx) => {
  let model = ctx.model('lover')
  model.setAttributes(ctx.post);
  model.filterAttributes(['man_id', 'woman_id']);
  await model.updateAll();
  if (model.getError()) {
    return ctx.warning = model.getError()
  }
  ctx.data.result = {affected: 1}
};

exports.unbindLover = async (ctx) => {
  let model = ctx.model('lover');
  model.where({id: Orm.eq(ctx.lover.id)})
  ctx.data.result = await {affected: model.deleteAll()}
}

exports.loverThings = async (ctx) => {
  let model = ctx.model('loverThing');
  model.where({lover_id: Orm.eq(ctx.lover.id)})
  if (ctx.query.select === 'self') {
    model.where({user_id: Orm.eq(ctx.uid)})
  } else if (ctx.query.select === 'partner') {
    model.where({user_id: Orm.eq(ctx.partnerId)})
  }
  delete ctx.query.select;
  model.joinUser();
  model.addWhere(ctx.query);
  ctx.data.counts = await model.counts();
  ctx.data.items = await model.findAll();
}

exports.createLoverThing = async (ctx) => {
  const {occur_date} = ctx.post;
  if (!validator.isDate(occur_date)) {
    ctx.warning = '时间格式不正确';
    return
  }
  let model = ctx.model('loverThing');
  model.setAttribute('user_id', ctx.uid);
  model.setAttribute('lover_id', ctx.lover.id);
  model.setAttributes(ctx.post);
  let result = await model.create();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = {affected: 1}
}

exports.updateLoverThing = async (ctx) => {
  let model = ctx.model('loverThing')
  let record = await model.findByPk(ctx.post.id);
  if (!record.id) {
    ctx.warning = '记录不存在或已被删除';
    return
  } else if (record.user_id != ctx.uid) {
    ctx.warning = '您无权修改';
    return
  }
  model.setAttributes(ctx.post);
  model.filterAttributes(['lover_id', 'user_id']);
  ctx.result.affected = await model.updateAll()
}

exports.delLoverThing = async (ctx) => {
  let tids = [];
  if (ctx.post.hasOwnProperty('tid')) {
    tids.push(ctx.post.tid)
  } else if (ctx.post.hasOwnProperty('tids')) {
    tids = ctx.post.tids;
  } else {
    return ctx.warning = '请选择要删除的记录'
  }
  let model = ctx.model('loverThing');
  model.where({id: Orm.in(tids)})
  let records = await model.findAll();
  if (records.length === 0) {
    return ctx.warning = '记录不存在或已被删除';
  }
  ctx.data.result = await {affected: model.where({id: Orm.in(tids)}).deleteAll()}
}