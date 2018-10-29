'use strict'
const Query = require('../lib/query')
const tasks = module.exports = {};

tasks.updateRepayAmount = async function (account_id) {
  if (!account_id) return false;
  let model = Query.factory('account');
  let repay_amount = await Query.factory('account_logs').where({account_id: Query.eq(account_id)}).select('amount').sum();
  let record = await model.findByPk(account_id);
  model.setAttribute('repay_amount', repay_amount);
  model.setAttribute('status', record.total_amount === repay_amount ? 1 : 0)
  await model.update();
}