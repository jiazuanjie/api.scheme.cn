'use strict'
const Orm = require('../lib/orm')

/**
 * 存款管理
 * @param ctx
 * @param next
 * @returns {Promise<string>}
 */
exports.manage = async (ctx, next) => {
  const { pid } = this.query || this.post
  if (!pid) {
    return ctx.warning = '没有指定项目!'
  }
  ctx.pid = pid;
  ctx.project = await ctx.model('piggyBank').findByPk(pid)
  if (!ctx.project.id) {
    return ctx.warning = '项目不存在或已被删除'
  }
  await next()
}

/**
 * 存款列表
 * @param ctx
 * @returns {Promise<void>}
 */
exports.list = async (ctx) => {
  let model = ctx.model('piggyBank');
  model.where({user_id: Orm.eq(ctx.uid), is_finsh: Orm.eq(0)})
  model.addWhere(this.query)
  ctx.data.counts = await model.counts()
  ctx.data.result = await model.limit(100).findAll()
}

/**
 * 添加存款项目
 * @param ctx
 * @returns {Promise<void>}
 */
exports.create = async (ctx) => {
  if (Object.keys(ctx.post).length === 0) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = ctx.model('piggyBank')
  model.setAttributes(ctx.post)
  model.setAttribute('user_id', ctx.uid)
  let result = await model.create()
  if (!result) {
    ctx.warning = model.getError()
    return ;
  }
  ctx.data.result = {affected: 1}
}

/**
 * 修改存款项目
 * @param ctx
 * @returns {Promise<*>}
 */
exports.update = async (ctx) => {
  if (Object.keys(ctx.post).length === 0) {
    return ctx.warning = '您还没有提交任何内容';
  }
  let model = ctx.model('piggyBank');
  model.where({id: Orm.eq(ctx.pid)})
  model.setAttributes(Object.assign({}, ctx.project, ctx.post))
  let result = await model.update();
  if (!result) {
    return ctx.warning = model.getError();
  }
  ctx.data.result = {affected: 1}
}

/**
 * 存款项目设置
 * @param ctx
 * @returns {Promise<*>}
 */
exports.setting = async (ctx) => {
  let model = ctx.model('piggyBank')
  model.where({id: Orm.eq(ctx.pid)})
  model.setAttributes(Object.assign({}, ctx.project, ctx.post))
  let result = await model.update();
  if (!result) {
    return ctx.warning = model.getError()
  }
  ctx.data.result = {affected: 1}
}

/**
 * 删除存款项目
 * @param ctx
 * @returns {Promise<*>}
 */
exports.delete = async (ctx) => {
  let pids = [];
  if (ctx.post.hasOwnProperty('pid')) {
    pids.push(ctx.post.pid)
  } else if (ctx.post.hasOwnProperty('pids')) {
    pids = ctx.post.pids
  } else {
    return ctx.warning = '请选择要删除的项目'
  }
  let model = ctx.model('piggyBank')
  model.where({id: Orm.in(pids)})
  let records = await model.findAll();
  if (records.length === 0) {
    return this.warning = '项目不存在或已被删除'
  }
  await model.where({id: Orm.in(pids)}).deleteAll()
  if (model.getError()) {
    return ctx.warning = model.getError()
  }
  ctx.data.result = {affected: 1}
}

/**
 * 存款项目详情
 * @param ctx
 * @returns {Promise<void>}
 */
exports.detail = async (ctx) => {
  let logs = await ctx.model('piggyBankLogs').where({project_id: Orm.eq(ctx.pid)}).limit(1000).findAll()
  let result = ctx.project;
  result.logs = logs
  ctx.data.result = result
}

/**
 * 添加存款记录
 * @param ctx
 * @returns {Promise<*>}
 */
exports.createLog = async (ctx) => {
  let { amount, remark, is_advance } = ctx.post;
  if (is_advance === 1 && amount > ctx.project.completed_amount) {
    return ctx.warning = '金额超过了存储的金额'
  }
  let model = ctx.model('piggyBankLogs')
  model.setAttributes({
    amount: parseInt(amount),
    remark,
    is_advance,
    project_id: ctx.pid
  })
  await model.create();
  if (model.getError()) {
    return ctx.warning = model.getError()
  }
  //更新已存金额
  await Tasker.piggyBank.updateAmount(ctx.pid, is_advance, 0, amount)
  ctx.data.result = {affected: 1}
}

/**
 * 更新存款记录
 * @param ctx
 * @returns {Promise<*>}
 */
exports.updateLog = async (ctx) => {
  let { id, amount, remark } = ctx.post;
  let model = ctx.model('piggyBankLogs')
  let logs = await model.findByPk(id)
  if (!logs.id) {
    return ctx.warning = '记录不存在或已被删除'
  } else if (logs.is_advance === 1 && (amount - logs.amount) > ctx.project.completed_amount) {
    return ctx.warning = '金额超过了存储的金额'
  }
  await model.where({id: Orm.eq(id)}).setAttributes({amount, remark}).update()
  if (model.getError()) {
    return ctx.warning = model.getError()
  }
  await Tasker.piggyBank.updateAmount(ctx.pid, logs.is_advance, logs.amount, amount)
  ctx.data.result = {affected: 1}
}

/**
 * 删除存款记录
 * @param ctx
 * @returns {Promise<*>}
 */
exports.deleteLog = async (ctx) => {
  const { id } = ctx.post
  let model = ctx.model('piggyBankLogs')
  let log = await model.findByPk(id)
  if (!log.id) {
    return ctx.warning = '记录不存在或已被删除'
  }
  await model.where({id: Orm.eq(id)}).deleteAll()
  if (model.getError()) {
    return ctx.warning = model.getError()
  }
  await Tasker.piggyBank.updateAmount(ctx.pid, log.is_advance, log.amount, 0)
  ctx.data.result = {affected: 1}
}