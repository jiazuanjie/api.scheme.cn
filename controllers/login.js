'use strict'
const request = require('request')
const mconfig = require('../config/main')
const WXBizDataCrypt = require('../lib/WXBizDataCrypt');
const Orm = require('../lib/orm')
const Query = require('../lib/query')

function getWxOpenId(code) {
  return new Promise((resolve, reject) => {
    return request.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${mconfig.weixin.appid}&secret=${mconfig.weixin.secret}&js_code=${code}&grant_type=authorization_code`, {}, function (err, res, body) {
      return resolve(JSON.parse(body))
    });
  })
}

/**
 * 微信登录
 * @param ctx
 * @returns {Promise<void>}
 */
exports.wxlogin = async (ctx) => {
  const {code} = ctx.post;
  let wxInfo = await getWxOpenId(code);
  let model = await ctx.model('userWeixin').where({openid: Orm.eq(wxInfo.openid)}).find();
  if (!model.id) {
    ctx.post.sessionKey = wxInfo.session_key
    await wxRegister(ctx.post, ctx.orm());

  }
}

/**
 * 微信注册
 * @param data
 * @returns {Promise<void>}
 */
async function wxRegister(data, _orm) {
  let Weixin = new WXBizDataCrypt(mconfig.weixin.appid, data.sessionKey)
  let result = Weixin.decryptData(data.encryptedData, data.iv);

  try {
    await _orm.query('BEGIN');
    let model = Query.factory('user');
    model.setAttributes({
      username: result.nickname,
      nickame: result.nickname,
      sex: result.gender,
      avatar_url: result.avatarUrl
    })
    let user = await model.create();
    if (!user || model.getError()) throw new Error(model.getError());
    await Query.factory('user_weixin').setAttributes({
      openid: result.open_id,
      session_key: data.sessionKey,
      nickname: result.nickname,
      gender: result.gender,
      language: result.language,
      country: result.country,
      province: result.province,
      city: result.city,
      avatar_url: result.avatarUrl,
      user_id: user.id
    }).create();
    await _orm.query('COMMIT');
  } catch (err) {
    await _orm.query('ROLLBACK');
    
  }
}
