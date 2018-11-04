'use strict';
const config = require('../config/main')

//登录验证
exports.login = async (ctx, next) => {
  if (ctx.uid) {
    await next();
  } else {
    ctx.warning = {errno: 1001, message: '您还没有登录，请先登录！'};
    return ;
  }
};

//普通登录身份验证
exports.auth = function () {
  return async (ctx, next) => {
    ctx.uid = 0;
    ctx.user = {};
    let req = {};
    if (ctx.headers.appkey || ctx.query._appkey) {
      req.appkey = ctx.headers.appkey || ctx.query._appkey;
      req.uid = ctx.headers.uid || ctx.query._uid || '';
      req.token = ctx.headers.token || ctx.query._token || '';
      req.timestamp = ctx.headers.timestamp || ctx.query._timestamp || '';
      req.access_token = ctx.headers['access-token'] || ctx.headers['_access-token'] || '';
      req.expire_timestamp = ctx.headers['expire-timestamp'] || ctx.query['_expire-timestamp'] || '';
    }
    //接口模拟
    if (config.env !== 'production' && ctx.query['debug_uid']) {
      req.appkey = ctx['headers']['appkey'] = ctx['headers']['appkey'] || 'android';
      req.uid = ctx['headers']['uid'] || ctx.query['debug_uid'] || 1;
      req.expire_timestamp = ctx['headers']['expire_timestamp'] || new Date().getTime();
      req.access_token = lib.md5(req.uid.toString() + String(req.expire_timestamp) + config['keys']['newTokenkey']);
    }
    ctx.user_ip = ctx['headers']['userip'] || ctx['headers']['x-real-ip'] || ctx.ip;
    //令牌判断
    if (!req.appkey) {
      return ctx.warning = 'appkey不能为空';
    } else if (config.appkeys.indexOf(req.appkey) < 0) {
      return ctx.warning = {errno: 403, message: '未被授权的appkey'};
    }
    if (validator.isPosInt(req.uid)) {
      if (!(req.timestamp && req.token) && !(req.access_token && req.expire_timestamp)) {
        return ctx.warning = {errno: 401, message: '授权信息有误'};
      }

      if (req.access_token && req.expire_timestamp) {
        let localToken = lib.md5(req.uid.toString() + req.expire_timestamp.toString() + config.keys.newTokenkey);
        if (req.access_token !== localToken) {
          //解决用户端使用access-token变量名但使用老token值问题
          let localOldToken = lib.md5(req.uid.toString() + req.expire_timestamp.toString() + config.keys.tokenkey);
          if (localOldToken !== req.access_token) {
            return ctx.warning = {errno: 1001, message: '登录过期或已失效，请重新登录'};
          }
        }
      } else if (req.token) {
        let localToken = lib.md5(req.uid.toString() + req.timestamp.toString() + config.keys.tokenkey);
        if (req.token !== localToken) {
          return ctx.warning = {errno: 1001, message: '用户身份验证失败，请重新登录'};
        }
      }

      //获取用户最新信息
      let user = await ctx.model('user').cache('id' + req.uid).findByPk(req.uid);
      if (Object.keys(user).length && (!user.id || !user.username)) {
        //global.redis.del('user:id' + req.uid);
        ctx.warning = {errno: 1001, message: '数据请求失败，请重试'};
        return ;
      } else if (!user.id) {
        ctx.warning = {errno: 1001, message: '用户账户不存在'};
        return ;
      } else if (user.is_closed) {
        ctx.warning = {errno: 1001, message: '用户账户已被冻结'};
        return ;
      } else {
        ctx.user = user;
        ctx.uid = parseInt(user.id);
        if (lib.datetime('YYY-MM-DD') !== lib.dateFormat(user.last_visit_at, 'YYYY-MM-DD')) {
          //更新最后访问时间和访问次数
        } else if (lib.timestamp() - lib.timestamp(user.last_visit_at) >= 60) {
          //更新最后访问时间
        }
      }
    }
    await next();
  }
}