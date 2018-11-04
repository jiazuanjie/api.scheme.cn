'use strict'
const Query = require('../lib/query')
const tasks = module.exports = {};

tasks.afterSaveAccount = async function (account_id, mongo) {
  if (!account_id) return false;
  let model = Query.factory('account');
  let record = await model.findByPk(account_id);
  let contact_id = await Tasker.contacts.bindContact(record, mongo);
  if (contact_id && record.contact_id !== contact_id) {
    await model.where({id: Query.eq(account_id)}).setAttribute('contact_id', contact_id).update();
  }
}

tasks.updateRepayAmount = async function (account_id) {
  if (!account_id) return false;
  //给钱
  let give_amount = await Query.factory('account_logs').where({account_id: Query.eq(account_id), is_repay: Query.eq(2)}).select('amount').sum();
  //拿钱
  let take_amount = await Query.factory('account_logs').where({account_id: Query.eq(account_id), is_repay: Query.eq(1)}).select('amount').sum();
  let total_amount = give_amount - take_amount;
  let is_borrow = total_amount > 0 ? 0 : 1;
  total_amount = total_amount < 0 ? Math.abs(total_amount) / 100 : total_amount / 100
  let model = Query.factory('account');
  await model.findByPk(account_id);
  model.setAttribute('total_amount', total_amount);
  model.setAttribute('is_borrow', is_borrow)
  await model.update();
}