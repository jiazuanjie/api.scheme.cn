'use strict'
const _router = require('koa-router');
const Mina = require('../../lib/mina');
const Config = require('../../config');

const router = new _router({
  prefix: '/api',
});

router.post('/wxlogin', async ctx => {
  const {encryptedData, iv, code} = ctx.post;
  if (!encryptedData || !iv || !code) {
    return ctx.warning = '授权信息不完整';
  }
  let mina = new Mina(Config.mina);
  let session = await mina.getSession(code);
  let result = mina.decryptData({encryptedData, iv, session});
console.log(result)
  ctx.data.result = await ctx.service.User.wxLogin(result);
});

router.get('/decryptData', async ctx => {
  let {data, iv, code} = ctx.query;
  if (!data || !iv || !code) {
    return ctx.warning = '授权信息不完整';
  }
  let mina = new Mina(config.mina);
  let session = await mina.getSession(code);
  let result = mina.decryptData({encryptedData: data, iv, session});
  if (!result.unionId) return ctx.warning = '获取微信授权信息不完整';
});

module.exports = router.middleware();