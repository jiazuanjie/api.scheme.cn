'use strict';
const _router = require('koa-router');
const {isLogin} = require('../../middlewares/access');

const router = new _router({
  prefix: '/api/cash_gift'
});

router.use('*', isLogin);

router.get('/type', async ctx => {
  let {items, count} = await ctx.service.App.findAllCount({
    order: [['orderby', 'ASC']]
  }, 'CashGiftCategory');
  ctx.data.result = items;
});

router.get('/list', async ctx => {
  let where = {user_id: ctx.state.uid};
  if (['0', '1'].includes(ctx.query.classify)) {
    where.classify = ctx.query.classify;
  }
  ctx.db.models.CashGift.belongsTo(ctx.db.models.CashGiftCategory, {foreignKey: 'type_id'});
  let {items, count} = await ctx.service.CashGift.findAllCount({
    attributes: {exclude: ['created_at', 'updated_at', 'deleted_at']},
    where,
    include: {
      model: ctx.db.models.CashGiftCategory,
      attributes: ['name']
    }
  });

  for (let item of items) {
    item.cate_name = item.CashGiftCategory.name || '';
    delete item.CashGiftCategory;
  }

  let give_amount = await ctx.service.CashGift.sum('total_amount', {where: {user_id: ctx.state.uid, classify: 1}});
  let receive_amount = await ctx.service.CashGift.sum('total_amount', {where: {user_id: ctx.state.uid, classify: 0}});
  ctx.data = {
    items,
    counts: {
      page: ctx.db._page,
      per_page: ctx.db._limit,
      total_items: count,
      total_page: count > 0 && ctx.db._limit > 0 ? (Math.ceil(count / ctx.db._limit)) : 0,
      give_amount: Math.round10(give_amount / 100, 2),
      receive_amount: Math.round10(receive_amount / 100, 2)
    }
  }
});

router.get('/detail', async ctx => {
  let result = await ctx.service.CashGift.findByPk(ctx.query.pid);
  result.logs = await ctx.service.App.findAll({
    where: {
      project_id: ctx.query.pid
    }
  }, 'CashGiftLogs');
  ctx.data.result = result;
});

router.post('/create', async ctx => {
  const {type_id, name, classify} = ctx.post;
  ctx.data.result = await ctx.service.CashGift.create({
    type_id,
    name,
    classify,
    user_id: ctx.state.uid
  })
});

router.post('/update', async ctx => {
  const {name, classify, type_id, pid} = ctx.post;
  ctx.data.result = await ctx.service.CashGift.update({
    name,
    classify,
    type_id
  }, {where: {id: pid}});
});

router.post('/delete', async ctx => {
  const {pid} = ctx.post;
  ctx.data.result = await ctx.service.CashGift.destroy({
    where: {id: pid, user_id: ctx.state.uid}
  })
});

router.get('/logs/detail', async ctx => {
  const {record_id} = ctx.query;
  let record = await ctx.service.App.findByPk(record_id, {}, 'CashGiftLogs');
  if (!record.id) {
    return ctx.warning = '记录不存在或已被删除';
  }

  ctx.data.result = record;
});

router.post('/logs/create', async ctx => {
  const {username, amount, group_id, remark, date, pid} = ctx.post;
  if (!validator.isPosInt(pid)) {
    return ctx.warning = '请传递pid';
  } else if (!validator.isMoney(amount)) {
    return ctx.warning = '金额格式不正确';
  }
  let project = await ctx.service.CashGift.findByPk(pid);
  if (!project.id) {
    return ctx.warning = '项目不存在或已被删除';
  }
  await ctx.service.App.create({
    project_id: pid,
    user_id: ctx.state.uid,
    username,
    amount: Math.round10(amount * 100),
    group_id,
    remark,
    date
  }, {}, 'CashGiftLogs');

  await updateCashGift(ctx, pid);
  ctx.data.result = {affected: 1};
});

router.post('/logs/update', async ctx => {
  const {record_id, username, amount, group_id, remark, date} = ctx.post;
  if (!validator.isPosInt(record_id)) {
    return ctx.warning = '请确定记录';
  } else if (!validator.isMoney(amount)) {
    return ctx.warning = '金额格式不正确';
  }
  let record = await ctx.service.App.findByPk(record_id, {}, 'CashGiftLogs');
  if (!record.id) {
    return ctx.warning = '记录不存在或已被删除';
  }
  await ctx.db.models.CashGiftLogs.update({
    username,
    amount: Math.round10(amount * 100),
    group_id,
    remark,
    date
  }, {where: {id: record_id}});

  await updateCashGift(ctx, record.project_id);
  ctx.data.result = {affected: 1}
});

router.post('/logs/delete', async ctx => {
  const {record_id} = ctx.post;
  if (!validator.isPosInt(record_id)) {
    return ctx.warning = '请传递reocrd_id';
  }
  let record = await ctx.service.App.findByPk(record_id , {}, 'CashGiftLogs');
  if (!record.id) {
    return ctx.warning = '记录不存在或已被删除';
  }
  ctx.data.result = {affected: await ctx.service.App.destroy({where: {id: record_id}}, 'CashGiftLogs')};
  await updateCashGift(ctx, record.project_id);
});

async function updateCashGift(ctx, pid) {
  let total_amount = await ctx.service.App.sum('amount', {where: {project_id: pid}}, 'CashGiftLogs');
  let total_num = await ctx.service.App.count({where: {project_id: pid}}, 'CashGiftLogs');
  await ctx.service.CashGift.update({total_amount, total_num}, {where: {id: pid}});
  return true;
}

module.exports = router.middleware();