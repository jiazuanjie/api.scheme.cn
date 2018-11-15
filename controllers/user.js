'use strict';
const Orm = require('../lib/orm');

exports.userInfo = async (ctx) => {
  ctx.data.result = ctx.user
}
