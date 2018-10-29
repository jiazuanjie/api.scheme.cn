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
 * @param data
 * @param mongo
 * @returns {Promise<void>}
 */
tasks.afterCreateCashGiftLog = async function (data, mongo) {
  if (!data || data.length === 0 || !mongo) return ;
  //绑定通讯录亲友
  let contact_id = data.contacts_id;
  if (!contact_id) {
    let contact = await Contacts.factory().setConn(mongo).where({$or: [{name: {$regex:data.username}}, {nickname: {$regex:data.username}}]}).addWhere({group_id: data.group_id}).find();
    if (!contact._id) {
      contact = await Contacts.factory().setConn(mongo).setAttributes({
        name: data.username,
        nickname: data.username,
        first_letter: lib.getFirstLetter(data.username).toUpperCase(),
        group_id: data.group_id,
        sex: 0,
        avatar_path: '',
        user_id: 0,
        bind_user_id: data.user_id,
        mobile: '',
        intimacy: 0
      }).create();
    }
    contact_id = contact._id;
    await Query.factory('cash_gift_logs').where({id: Query.eq(data.id)}).setAttribute("contact_id", contact_id).update();
  }
  //增加亲友亲密度 20元 1亲密度
  let intimacy = parseInt(parseInt(data.amount) / 100 / 20);
  await Contacts.factory().setConn(mongo).where({_id: Mquery.ObjectId(contact_id)}).update({$inc: {intimacy: intimacy}}, true);
  //首次添加，增加用户积分
  let log = await Query.factory('cash_gift_logs').where({user_id: Query.eq(data.user_id)}).format(false).find();
  if (!log.id) {
    Tasker.user.addUserIntegral(data.user_id, 'cash_gift', 'create_cash_gift_log', 'cash_gift_logs', data.id);
  }
}

module.exports = tasks;