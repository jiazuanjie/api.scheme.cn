'use strict'
const Contacts = require('../models/mongo/contacts')
const Mquery = require('../lib/mquery')
const Orm = require('../lib/orm')

/**
 * 债款管理
 * @param ctx
 * @param next
 * @returns {Promise.<void>}
 */
exports.manage = async (ctx, next) => {
  ctx.pid = ctx.post.pid || ctx.query.pid;
  ctx.project = {};
  if (!validator.isPosInt(ctx.pid)) {
    ctx.warning = '没有指定债款记录!'; return;
  }
  let model = ctx.model('account');
  ctx.project = await model.findByPk(ctx.pid);
  if (!ctx.project.id) {
    ctx.warning = {error: 404, message: '债款记录不存在或已被删除'};
    return ;
  } else {
    await next();
  }
}

/**
 * 债款列表
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountList = async (ctx) => {
  let model = ctx.model('account')
  model.where({user_id: Orm.eq(ctx.uid)})
  model.addWhere(ctx.query)
  ctx.data.counts = await model.counts()
  ctx.data.items = await model.findAll()
}

/**
 * 添加债款记录
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountCreate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('account')
  model.setAttributes(ctx.post)
  model.setAttribute('user_id', ctx.uid)
  let result = await model.create()
  if (!result) {
    ctx.warning = model.getError()
    return ;
  }
  await Tasker.account.afterSaveAccount(result.id, ctx.mongo('scheme'));
  ctx.data.result = {affected: 1}
}

/**
 * 更新债款记录
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountUpdate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('account');
  model.where({id: Orm.eq(ctx.pid)})
  model.setAttributes(Object.assign({}, ctx.project, ctx.post))
  let result = await model.update();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  await Tasker.account.afterSaveAccount(ctx.pid, ctx.mongo('scheme'))
  ctx.data.result = {affected: 1}
}

/**
 * 删除债款记录
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountDelete = async (ctx) => {
  let pids = [];
  if (ctx.post.hasOwnProperty('pid')) {
    pids.push(ctx.post.pid)
  } else if (ctx.post.hasOwnProperty('pids')) {
    pids = ctx.post.pids
  } else {
    ctx.warning = '请选择要删除的债款记录'
    return ;
  }
  let model = ctx.model('account');
  let records = await model.where({id: Orm.in(pids)}).findAll()
  if (!records) {
    ctx.warning = '债款记录不存在或已被删除'
    return ;
  }
  await model.where({id: Orm.in(pids)}).deleteAll();
  ctx.data.result = {affected: 1}
}

/**
 * 债款记录详情
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountDetail = async (ctx) => {
  ctx.project.contact = await Contacts.factory().setConn(ctx.mongo('scheme')).findByPk(Mquery.ObjectId(ctx.project.contact_id))
  ctx.project.logs = await ctx.model('accountLogs').where({account_id: Orm.eq(ctx.pid)}).order("t.repay_date desc").limit(500).findAll()
  ctx.data.result = ctx.project
}

/**
 * 债款记录
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountLogs = async (ctx) => {
  let model = ctx.model('accountLogs');
  model.where({account_id: Orm.eq(ctx.pid)});
  model.order('t.repay_date DESC')
  ctx.data.counts = await model.counts()
  ctx.data.items = await model.limit(500).findAll()
  ctx.data.account = ctx.project
}

/**
 * 添加债款记录
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountLogsCreate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('accountLogs');
  model.setAttributes(ctx.post);
  model.setAttribute('account_id', ctx.pid)
  let result = await model.create();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  await Tasker.account.updateRepayAmount(ctx.pid)
  ctx.data.result = {affected: 1}
}

/**
 * 更新债款记录
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountLogsUpdate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('accountLogs');
  let record = await model.findByPk(ctx.post.log_id);
  if (!record.id) {
    ctx.warning = '记录不存在或已被删除';
    return ;
  }
  model.where({id: Orm.eq(ctx.post.log_id)})
  model.setAttributes(Object.assign({}, record, ctx.post));
  let result = await model.update();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  await Tasker.account.updateRepayAmount(record.account_id);
  ctx.data.result = {affected: 1}
}

/**
 * 债款记录详情
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountLogsDetail = async (ctx) => {
  let model = ctx.model('accountLogs');
  let record = await model.findByPk(ctx.query.log_id);
  if (!record.id) {
    ctx.warning = '记录不存在或已被删除';
    return ;
  }
  record.account = await ctx.model('account').findByPk(record.account_id);
  ctx.data.result = record
}

/**
 * 删除债款记录
 * @param ctx
 * @returns {Promise.<void>}
 */
exports.accountLogsDelete = async (ctx) => {
  let log_ids = [];
  if (ctx.post.hasOwnProperty('log_id')) {
    log_ids.push(ctx.post.log_id)
  } else if (ctx.post.hasOwnProperty('log_ids')) {
    log_ids = ctx.post.log_ids
  } else {
    ctx.warning = '请选择要删除的债款记录'
    return ;
  }
  let model = ctx.model('accountLogs');
  let records = await model.where({id: Orm.in(log_ids)}).findAll();
  if (!records) {
    ctx.warning = '债款记录不存在或已被删除';
    return ;
  }
  let account_id = records.map(r => {return r.account_id})
  await model.where({id: Orm.in(log_ids)}).deleteAll();
  await Tasker.account.updateRepayAmount(account_id)
  ctx.data.result = {affected: 1}
}