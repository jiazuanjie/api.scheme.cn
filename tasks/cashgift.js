'use strict';
const Query = require('../lib/query');
const Mquery = require('../lib/mquery');
const Contacts = require('../models/mongo/contacts')

let tasks = {};

/**
 * 创建礼单
 * 1、首次创建礼单，增加用户积分
 * @param data
 * @returns {Promise<void>}
 */
tasks.afterCreateCashGift = async function (data) {
  if (!data || data.length === 0) return ;
  //首次创建礼单，增加用户积分
  let firstProject = await Query.factory('cash_gift').where({user_id: Query.eq(data.user_id), classify: Query.eq(data.classify), id: Query.ne(data.id)}).filterDeleted(false).find();
  if (!firstProject.id) {
    let action = data.classify === 0 ? 'first_create_accept_gift' : 'first_create_give_gift';
    Tasker.user.addUserIntegral(data.user_id, 'cash_gift', action, 'cash_gift', data.id);
  }
}

/**
 * 添加礼单记录
 * 1、绑定通讯录亲友
 * 2、增加亲密度
 * 3、首次添加，增加用户积分
 * @param log_id
 * @param mongo
 * @returns {Promise<void>}
 */
tasks.saveCashGiftLog = async function (log_id, mongo) {
  if (!log_id || !mongo) return ;
  let model = Query.factory('cash_gift_logs');
  let record = await model.findByPk(log_id);
  //绑定通讯录亲友
  let contact_id = await Tasker.contacts.bindContact(record, mongo);
  if (contact_id && record.contact_id !== contact_id) {
    await Query.factory('cash_gift_logs').where({id: Query.eq(log_id)}).setAttribute("contact_id", contact_id).update();
    await Contacts.factory().setConn(mongo).where({_id: Mquery.ObjectId(contact_id)}).update({$inc: {intimacy: 1}}, true)
  }
  await Tasker.cashgift.updateCashGift(record.project_id);
  //首次添加，增加用户积分
  let log = await Query.factory('cash_gift_logs').where({user_id: Query.eq(record.user_id)}).format(false).find();
  if (!log.id) {
    Tasker.user.addUserIntegral(record.user_id, 'cash_gift', 'create_cash_gift_log', 'cash_gift_logs', record.id);
  }
}

/**
 * 更新礼单金额和人次
 * @param cash_id
 * @returns {Promise<void>}
 */
tasks.updateCashGift = async function (cash_id) {
  let model = Query.factory('cash_gift_logs');
  model.where({project_id: Query.eq(cash_id)});
  let total_num = await model.count();
  let total_amount = await model.sum('amount');
  total_amount = total_amount / 100;
  await Query.factory('cash_gift').where({id: Query.eq(cash_id)}).setAttributes({total_num, total_amount}).update();
}



module.exports = tasks;