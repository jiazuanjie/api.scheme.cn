'use strict';
const Orm = require('../lib/orm');

exports.manage = async (ctx, next) => {
  ctx.teacher = await this.model('schoolTeacher').where({user_id: Orm.eq(ctx.uid)}).find();
  if (!ctx.teacher.id) {
    ctx.warning = '尚未登记成教师'; return ;
  }
  await next();
}

exports.class = async (ctx) => {
  let model = ctx.model('')
}