'use strict'
const request = require('request')
const mconfig = require('../config/main')
const WXBizDataCrypt = require('../lib/WXBizDataCrypt');
const Orm = require('../lib/orm')
const Query = require('../lib/query')

function getWxOpenId(code) {
    return new Promise ((resolve, reject) => {
        return request.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${mconfig.weixin.appid}&secret=${mconfig.weixin.secret}&js_code=${code}&grant_type=authorization_code`, {}, function (err, res, body) {
            return resolve(JSON.parse(body))
        });
    })
}

exports.wxlogin = async (ctx) => {
  const { code } = ctx.post;
  let wxInfo = await getWxOpenId(code);
  let model = await ctx.model('userWeixin').where({openid: Orm.eq(wxInfo.openid)}).find();
  if (!model.id) {
    ctx.post.sessionKey = wxInfo.session_key
    await wxRegister(ctx.post);

  }
}

async function wxRegister(data) {
  let Weixin = new WXBizDataCrypt(mconfig.weixin.appid, data.sessionKey)
  let result = Weixin.decryptData(data.encryptedData, data.iv);

    let user = await Query.factory('user').setAttributes({
        username: result.nickname,
        nickname: result.nickname,
        sex: result.gender,
        avatar_url: result.avatarUrl
    }).create()
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
  });
}
