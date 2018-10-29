'use strict'
const Contacts = require('../models/mongo/contacts')
const Orm = require('../lib/orm')

/**
 * 债款管理
 * @param ctx
 * @param next
 * @returns {Promise.<void>}
 */
exports.manage = async (ctx, next) => {
  ctx.pid = ctx.post.pid || ctx.query.id;
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
  model.setAttribute({user_id: ctx.uid})
  let result = await model.create()
  if (!result) {
    ctx.warning = model.getError()
    return
  }
  let contact_id = await Tasker.contacts.bindContact(result, ctx.mongo('scheme'))
  if (contact_id) {
    await ctx.model('account').where({id: Orm.eq(result.id)}).update({contact_id: contact_id})
  }
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
  model.setAttributes(Object.assign({}, ctx.project, ctx.post))
  let result = await model.update();
  if (!result) {
    ctx.warning = model.getError();
  }
  let contact_id = await Tasker.contacts.bindContact(result, ctx.model('scheme'));
  if (contact_id != result.contact_id) {
    await ctx.model('account').where({id: Orm.eq(result.id)}).update({contact_id})
  }
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
    pids.push(ctx.post.pids)
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
  ctx.project.logs = await ctx.model('accountLogs').where({account_id: Orm.eq(ctx.pid)}).findAll()
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
  ctx.data.result = await model.findAll()
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

exports.accountLogsUpdate = async (ctx) => {}

exports.accountLogsDetails = async (ctx) => {}

exports.accountLogsDelete = async (ctx) => {}