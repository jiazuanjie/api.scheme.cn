'use strict'

exports.login = async (ctx, next) => {
  if (this.uid) {
    await next();
  } else {
    return (this.warning = {errno: 1001, message: '您还没有登录，请先登录!'});
  }
}

exports.auth = async (ctx, next) => {
  this.uid = 0;
  this.user = {};
  console.log(ctx);
  await next();
}