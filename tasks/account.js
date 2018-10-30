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
  let model = Query.factory('account');
  let repay_amount = await Query.factory('account_logs').where({account_id: Query.eq(account_id)}).select('amount').sum();
  repay_amount = repay_amount / 100;
  let record = await model.findByPk(account_id);
  model.setAttribute('repay_amount', repay_amount);
  model.setAttribute('status', record.total_amount === repay_amount ? 1 : 0)
  await model.update();
}