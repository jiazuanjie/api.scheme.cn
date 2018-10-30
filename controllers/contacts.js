'use strict';
const Orm = require('../lib/orm');
const Contacts = require('../models/mongo/contacts');
const Mquery = require('../lib/mquery');

/**
 * 分组列表
 * @param ctx
 * @returns {Promise<void>}
 */
exports.groupList = async (ctx) => {
  let model = ctx.model('userContactsGroup');
  model.where({user_id: Orm.eq(ctx.uid)});
  ctx.data.result = await model.limit(50).findAll();
}

/**
 * 创建分组
 * @param ctx
 * @returns {Promise<void>}
 */
exports.groupCreate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容'
    return ;
  }
  let model = ctx.model('userContactsGroup');
  model.setAttributes(ctx.post);
  model.setAttribute('user_id', ctx.uid);
  let result = await model.create();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = result;
}

/**
 * 更新分组
 * @param ctx
 * @returns {Promise<void>}
 */
exports.groupUpdate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容'
    return ;
  }
  let model = ctx.model('userContactsGroup');
  let record = await model.findByPk(ctx.post.guoup_id);
  if (!record.id) {
    ctx.warning = '分组不存在或已被删除';
    return ;
  }
  model.setAttributes(Object.assign({}, record, ctx.post));
  let result = await model.update();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = {affected: 1};
}

/**
 * 删除分组
 * @param ctx
 * @returns {Promise<void>}
 */
exports.groupDelete = async (ctx) => {
  let gids = [];
  if (ctx.post.hasOwnProperty('gid')) {
    gids.push(ctx.post.gid);
  } else if (ctx.post.hasOwnProperty('gids')) {
    gids.push(ctx.post.gids);
  } else {
    ctx.warning = '请选择要删除的分组';
    return ;
  }
  let model = ctx.model('userContactsGroup');
  let records = await model.where({id: Orm.in(gids)}).findAll();
  if (records.length === 0) {
    ctx.warning = '分组不存在或已被删除';
    return ;
  }
  await model.where({id: Orm.in(gids)}).deleteAll();
  if (model.getError()) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = {affected: 1}
}

/**
 * 通讯录列表
 * @param ctx
 * @returns {Promise<void>}
 */
exports.contacts = async (ctx) => {
  let model = Contacts.factory();
  model.where({bind_user_id: ctx.uid});
  model.addWhere(ctx.query);
  model.order({first_letter: 1})
  model.setConn(ctx.mongo('scheme'))
  ctx.data.counts = await model.counts();
  ctx.data.items = await model.findAll();
}

/**
 * 新增联系人
 * @param ctx
 * @returns {Promise<void>}
 */
exports.contactCreate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容';
    return ;
  }
  let model = Contacts.factory();
  model.setAttributes(ctx.post);
  model.setAttributes({
    bind_user_id: ctx.uid,
    group_id: !!ctx.post.group_id ? ctx.post.group_id : 0,
    nickname: !!ctx.post.nickname ? ctx.post.nickname : '',
    sex: !!ctx.post.sex ? ctx.post.sex : 0,
    avatar_path: !!ctx.post.avatar_path ? ctx.post.avatar_path : '',
    user_id: 0,
    mobile: !!ctx.post.mobile ? ctx.post.mobile : '',
    intimacy: 0
  })
  let result = await model.setConn(ctx.mongo('scheme')).create();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = {affected: 1}
}

/**
 * 编辑联系人
 * @param ctx
 * @returns {Promise<void>}
 */
exports.contactUpdate = async (ctx) => {
  if (!Object.keys(ctx.post)) {
    ctx.warning = '您还没有提交任何内容'
    return ;
  }
  let model = Contacts.factory();
  let record = await model.setConn(ctx.mongo('scheme')).findByPk(Mquery.ObjectId(ctx.post.id))
  if (!record._id) {
    ctx.warning = '联系人不存在或已被删除';
    return ;
  }
  model.setAttributes(ctx.post);
  model.setConn(ctx.mongo('scheme'));
  let result = await model.update();
  if (!result) {
    ctx.warning = model.getError();
    return ;
  }
  ctx.data.result = {affected: 1}
}

/**
 * 删除联系人
 * @param ctx
 * @returns {Promise<void>}
 */
exports.contactDelete = async (ctx) => {
  let ids = [];
  if (ctx.post.hasOwnProperty('id')) {
    ids.push(ctx.post.id);
  } else if (ctx.post.hasOwnProperty('ids')) {
    ids.push(ctx.post.ids);
  } else {
    ctx.warning = '请选择要删除的联系人';
    return ;
  }
  let model = Contacts.factory();
  let affected = 0;
  for (let _id of ids) {
    await model.setConn(ctx.mongo('scheme')).where({_id: Mquery.ObjectId(_id)}).delete();
    affected++;
  }
  if (affected === 0) {
    ctx.warning = '联系人不存在或已被删除';
    return ;
  }
  ctx.data.result = {affected}
}

/**
 * 联系人详情
 * @param ctx
 * @returns {Promise<void>}
 */
exports.contactInfo = async (ctx) => {
  let model = Contacts.factory();
  let record = await model.setConn(ctx.mongo('scheme')).findByPk(Mquery.ObjectId(ctx.query.id));
  if (!record._id) {
    ctx.warning = '联系人不存在或已被删除';
    return ;
  }
  ctx.data.result = record
}