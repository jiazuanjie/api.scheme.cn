'use strict'
const Orm = require('../lib/orm')

/**
 * 银行卡管理
 * @param ctx
 * @param next
 * @returns {Promise<string>}
 */
exports.manage = async (ctx, next) => {
  const { pid } = ctx.post || ctx.query;
  if (!pid) {
    return ctx.warning = '请选择要操作的银行卡'
  }
  ctx.pid = pid;
  ctx.project = await ctx.model('userBank').findByPk(pid)
  if (!ctx.project.id) {
    return ctx.warning = '银行卡不存在或已被删除'
  }
  await next();
}

/**
 * 银行卡列表
 * @param ctx
 * @returns {Promise<void>}
 */
exports.list = async (ctx) => {
  let model = ctx.model('userBank')
  model.where({user_id: Orm.eq(ctx.uid)})
  ctx.data.result = await model.findAll()
}

/**
 * 创建银行卡
 * @param ctx
 * @returns {Promise<*>}
 */
exports.create = async (ctx) => {
  if (Object.keys(ctx.post).length === 0) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('userBank')
  model.setAttributes(ctx.post)
  model.setAttribute("user_id", ctx.uid)
  let result = await model.create();
  if (!result) {
    return ctx.warning = model.getError()
  }
  return ctx.data.result = {affected: 1}
}

/**
 * 更新银行卡信息
 * @param ctx
 * @returns {Promise<*>}
 */
exports.update = async (ctx) => {
  if (Object.keys(ctx.post).length === 0) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('userBank')
  model.setAttributes(Object.assign({}, ctx.project, ctx.post))
  model.where({id: Orm.eq(ctx.id)})
  let result = await model.update();
  if (!result) {
    return ctx.warning = model.getError()
  }
  return ctx.data.result = {affected: 1}
}

/**
 * 删除银行卡
 * @param ctx
 * @returns {Promise<void>}
 */
exports.delete = async (ctx) => {
  let pids = [];
  if (ctx.post.hasOwnProperty('pid')) {
    pids.push(ctx.post.pid)
  } else if (ctx.post.hasOwnProperty('pids')) {
    pids = ctx.post.pids
  } else {
    ctx.warning = '请选择要删除的银行卡'
    return ;
  }
  let model = ctx.model('userBank');
  let records = await model.where({id: Orm.in(pids)}).findAll()
  if (!records) {
    ctx.warning = '银行卡不存在或已被删除'
    return ;
  }
  await model.where({id: Orm.in(pids)}).deleteAll();
  ctx.data.result = {affected: 1}
}