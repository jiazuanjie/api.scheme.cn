'use strict';
const {md5} = require('../lib/library');
const Config = require('../config')

exports.isLogin = async function(ctx, next) {
  let token = ctx.headers['access-token'];
  let timestamp = ctx.headers['expire-timestamp'];
  let uid = ctx.headers['uid'];
  if (!token || !timestamp || !uid) {
    return ctx.warning = {errno: 1001, message: '您还没有登录，请先登录！'};
  }
  let localToken = md5(uid.toString() + timestamp.toString() + Config.keys.newTokenkey);
  if (token !== localToken) {
    return ctx.warning = {errno: 1001, message: '登录过期或已失效，请重新登录'};
  }

  let user = await ctx.service.User.findByPk(uid);
  if (!user.id) {
    return ctx.warning = {errno: 1001, message: '用户账户不存在'};
  }

  ctx.state.user = user;
  ctx.state.uid = user.id;

  await next();
};

exports.isLogin2 = async function(ctx, next) {
  let {access, uid} = ctx.headers;
  if (!token) {
    return ctx.warning = {errno: 401, message: '当前用户未登录'};
  }

  try {
    token = ctx.service.Jwt.verify(token);
    ctx.uid = token.user_id;
  } catch(err) {
    return ctx.warning = {errno: 400, message: 'token无效'};
  }

  if (ctx.uid != uid) {
    return ctx.warning = {errno: 400, message: '非法请求，用户不匹配'};
  }

  const user = await ctx.service.User.find({where: {id: ctx.uid}});
  if (!user.id) {
    return ctx.warning = {errno: 400, message: '用户不存在'};
  } else if (user.is_closed === 1) {
    return ctx.warning = {errno: 1011, message: '你的账号被冻结'};
  }

  //替换微信号后将先前登录账号退出
  const weixin = await ctx.service.User.find({where: {user_id: ctx.uid}}, 'UserWeixin');
  if (weixin.id && weixin.id != token.weixin_id) {
    return ctx.warning = {errno: 1012, message: '登录信息已过期'};
  }

  ctx.state._user = user;
  ctx.state.uid = user.id;

  await next();
};
