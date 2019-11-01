'use strict';
const Orm = require('../lib/orm');
const Mquery = require('../lib/mquery');
const Contacts = require('../models/mongo/contacts');

exports.manage = async (ctx, next) => {
  ctx.pid = ctx.post.pid || ctx.query.pid;
  ctx.project = {};
  if (!validator.isPosInt(ctx.pid)) {
    ctx.warning = '没有指定项目!'; return;
  }
  let model = ctx.model('cashGift');
  ctx.project = await model.findByPk(ctx.pid);
  if (!ctx.project.id) {
    ctx.warning = {error: 404, message: '项目不存在'};
    return ;
  } else {
    await next();
  }
}

/**
 * 礼单分类
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftType = async (ctx) => {
  let model = ctx.model('cashGiftCategory');
  let result = await model.order("orderby ASC").findAll();
  ctx.data.result = result;
}

/**
 * 礼单列表
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftList = async (ctx) => {
  let model = ctx.model('cashGift');
  model.where({user_id: Orm.eq(ctx.uid)});
  if (!!ctx.query.classify) {
    model.where({classify: Orm.eq(ctx.query.classify)})
  }
  model.addWhere(ctx.query);
  model.joinCategory();
  let result = await model.findAll();
  let counts = await model.counts({sums:[{name:'total_num', field: 't.total_num'}, {name: 'total_amount', field: 't.total_amount'}]});
  let give_amount = await ctx.model('cashGift').where({user_id: Orm.eq(ctx.uid), classify: Orm.eq(1)}).select('total_amount').sum();
  let receive_amount = await ctx.model('cashGift').where({user_id: Orm.eq(ctx.uid), classify: Orm.eq(0)}).select('total_amount').sum();
  counts.give_amount = give_amount / 100;
  counts.receive_amount = receive_amount / 100;  
  counts.total_amount = counts.total_amount / 100
  ctx.data.counts = counts;
  ctx.data.items = result;
}

/**
 * 创建礼单
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftCreate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  if (ctx.post.hasOwnProperty('type_id')) {
    let cateIds = await ctx.model('cashGiftCategory').findIds();
    if (!cateIds || cateIds.indexOf(parseInt(ctx.post.type_id)) === -1) {
      ctx.warning = '礼单所属分类不正确';
      return ;
    }
  }

  let model = ctx.model('cashGift');
  model.setAttributes(ctx.post);
  model.setAttribute('user_id', ctx.uid);
  let result = await model.create();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = result;
  Tasker.cashgift.afterCreateCashGift(result);
}

/**
 * 编辑礼单
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftUpdate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  if (ctx.post.hasOwnProperty('type_id')) {
    let cateIds = await ctx.model('cashGiftCategory').findIds();
    if (!cateIds || cateIds.indexOf(parseInt(ctx.post.type_id)) === -1) {
      ctx.warning = '礼单所属分类不正确';
      return ;
    }
  }
  let model = ctx.model('cashGift');
  model.setAttributes(Object.assign({}, ctx.project, ctx.post));
  let result = await model.where({id: Orm.eq(ctx.pid)}).update();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = {affected: 1};
}

/**
 * 删除礼单
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftDelete = async (ctx) => {
  let pids = [];
  if (ctx.post.hasOwnProperty('pid')) {
    pids.push(ctx.post.pid)
  } else if (ctx.post.hasOwnProperty('pids') && validator.isIds(ctx.post.pids)) {
    ctx.post.pids.map(p => {pids.push(p)})
  } else {
    ctx.warning = '请选择要删除的礼单'
    return ;
  }
  let model = ctx.model('cashGift');
  let records = await model.where({id: Orm.in(pids)}).findAll();
  if (records.length === 0) {
    ctx.warning = '礼单不存在或已被删除'
    return ;
  }
  await model.where({id: Orm.in(pids)}).deleteAll();
  if (model.getError()) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = {affected: 1}
}

/**
 * 礼单详情
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftDetail = async (ctx) => {
  let model = ctx.model('cashGift');
  let result = await model.findByPk(ctx.pid);
  result.logs = await ctx.model('cashGiftLogs').where({project_id: Orm.eq(ctx.pid)}).limit(1000).findAll();
  for (let r of result.logs) {
    r.contacts = await Contacts.factory().setConn(ctx.mongo('scheme')).findByPk(Mquery.ObjectId(r.contact_id));
 //   r.group_id = !!r.contacts.group_id ? r.contacts.group_id : 0;
  }
  ctx.data.result = result;
}

/**
 * 创建礼金明细
 * 1、创建明细
 * 2、增加创建者积分
 * 3、增加亲友
 * 4、增加亲密度
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftLogsCreate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('cashGiftLogs');
  model.setAttributes(ctx.post);
  model.setAttributes({
    project_id: ctx.pid,
    user_id: ctx.uid
  })
  let result = await model.create();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  await Tasker.cashgift.saveCashGiftLog(result.id, ctx.mongo('scheme'));
  ctx.data.result = {affected: 1};
}

/**
 * 编辑礼金明细
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftLogsUpdate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容'
    return;
  }
  let model = ctx.model('cashGiftLogs');
  let record = await model.findByPk(ctx.post.record_id);
  if (!record.id) {
    ctx.warning = '记录不存在或已被删除';
    return ;
  }
  model.setAttributes(Object.assign({}, record, ctx.post));
  let result = await model.update();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  await Tasker.cashgift.saveCashGiftLog(record.id, ctx.mongo('scheme'));
  ctx.data.result = {affected: 1}
}

/**
 * 礼金详情
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftLogsDetail = async (ctx) => {
  let record = await ctx.model('cashGiftLogs').findByPk(ctx.query.record_id);
  if (!record.id) {
    ctx.warning = '记录不存在或已被删除'
    return ;
  }
  record.contact = await Contacts.factory().setConn(ctx.mongo('scheme')).findByPk(record.contact_id);
  ctx.data.result = record;
}

/**
 * 删除礼金
 * @param ctx
 * @returns {Promise<void>}
 */
exports.cashGiftLogsDelete = async (ctx) => {
  let record_ids = [];
  if (ctx.post.hasOwnProperty('record_id')) {
    record_ids.push(ctx.post.record_id)
  } else if (ctx.post.hasOwnProperty('record_ids')) {
    record_ids.push(ctx.post.record_ids)
  } else {
    ctx.warning = '请选择要删除的记录'
    return ;
  }
  let model = ctx.model('cashGiftLogs');
  let records = await model.where({id: Orm.in(record_ids)}).limit(150).findAll();
  if (records.length === 0) {
    ctx.warning = '记录不存在或已被删除'
    return ;
  }
  let result = await model.where({id: Orm.in(record_ids)}).deleteAll();
  if (!result) {
    ctx.warning = model.getError()
    return ;
  }
  await Tasker.cashgift.updateCashGift(ctx.pid);
  ctx.data.result = {affected: 1}
}


exports.analyze = async (ctx) => {
  let models = await ctx.model('cashGiftLogs').where({user_id: Orm.eq(ctx.uid)}).order('group_id ASC, update_at DESC').findAll();
  let result = {}
  for (let row of models) {
    let project = await ctx.model('cashGift').findByPk(row.project_id)
    if (!project.id) {
      continue;
    }
    if (!result[row.username]) {
      result[row.username] = {
        give_amount: 0,
        receive_amount: 0,
        give_num: 0,
        receive_num: 0,
        group_id: row.group_id,
        name: row.username,
      }
    }
    if (project.classify == 1) {
      result[row.username]['give_amount'] += row.amount;
      result[row.username]['give_num']++;
    } else {
      result[row.username]['receive_amount'] += row.amount;
      result[row.username]['receive_num']++;
    }
  }

  ctx.data.result = result;
}

exports.signal = async (ctx) => {
  const {username} = ctx.query;
  let models = await ctx.model('cashGiftLogs').where({user_id: Orm.eq(ctx.uid), username: Orm.eq(username)}).findAll();
  for (let model of models) {
    model.project = await ctx.model('cashGift').findByPk(model.project_id);
  }

  ctx.data.result = models
}