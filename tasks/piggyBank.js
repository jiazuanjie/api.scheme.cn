'use strict'
const Query = require('../lib/query')

const tasks = module.exports = {}

/**
 * 更新完成金额
 * @param pid
 * @param is_advance
 * @param old_amount
 * @param now_amount
 * @returns {Promise<void>}
 */
tasks.updateAmount = async function (pid, is_advance, old_amount, now_amount) {
  if (!pid || [0, 1].indexOf(is_advance) === -1) return;
  let model = Query.factory('piggy_bank')
  let record = await model.findByPk(pid)
  let amount = old_amount - now_amount
  amount = is_advance === 1 ? amount : -amount;
  await model.where({id: Query.eq(pid)}).update({
    completed_amount: record.completed_amount + amount
  })
}