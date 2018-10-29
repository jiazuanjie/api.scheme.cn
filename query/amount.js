'use strict'

/**
 * 返回前端显示金额
 * @param record
 * @param param
 * @returns {Promise.<*>}
 */
exports.returnAmount = async function (record, param) {
  if (!record || !param) return {};
  param.map(p => {
    record.p = record.p / 100
  })
  return record
}