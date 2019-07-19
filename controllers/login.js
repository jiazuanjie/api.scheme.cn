'use strict'
const request = require('request')
const mconfig = require('../config/main')
const WXBizDataCrypt = require('../lib/WXBizDataCrypt');
const Orm = require('../lib/orm')
const Query = require('../lib/query')

function getWxOpenId(code) {
  return new Promise((resolve, reject) => {
    return request.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${mconfig.weixin.appid}&secret=${mconfig.weixin.secret}&js_code=${code}&grant_type=authorization_code`, {}, function (err, res, body) {
      resolve(JSON.parse(body))
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
  let userWeixin = await ctx.model('userWeixin').where({openid: Orm.eq(wxInfo.openid)}).find();
  let user_id = userWeixin && userWeixin.user_id;
  if (!userWeixin.id) {
    ctx.post.sessionKey = wxInfo.session_key
    user_id = await wxRegister(ctx.post);
    if (!user_id) {
      ctx.warning = '登录失败，请稍后再试'
      return ;
    }
  }
  let user = await ctx.model('user').findByPk(user_id);
  await ctx.model('user').where({id: Orm.eq(user_id)}).updateAll({
    last_login_ip: ctx.user_ip,
    last_login_at: lib.datetime(),
    last_visit_at: lib.datetime()
  });
  ctx.data.result = lib.loginUser(user);
}

/**
 * 微信注册
 * @param data
 * @returns {Promise<void>}
 */
async function wxRegister(data) {
  await Query.factory().query('BEGIN');
  try {
    let Weixin = new WXBizDataCrypt(mconfig.weixin.appid, data.sessionKey)
    let result = Weixin.decryptData(data.encryptedData, data.iv);
    let model = Query.factory('user');
    model.setAttributes({
      username: result.nickName,
      nickname: result.nickName,
      password: 'Wx123456',
      sex: result.gender,
      avatar_path: result.avatarUrl
    })
    let user_id = await model.create();
    if (!user_id || model.getError()) throw new Error(model.getError());
    await Query.factory('user_weixin').setAttributes({
      openid: result.openId,
      session_key: data.sessionKey,
      nickname: result.nickName,
      gender: result.gender,
      language: result.language,
      country: result.country,
      province: result.province,
      city: result.city,
      avatar_url: result.avatarUrl,
      user_id: user_id
    }).create();


    await Query.factory('user_contacts_group').create({
      user_id: user_id,
      name: '朋友'
    });
    await Query.factory('user_contacts_group').create({
      user_id: user_id,
      name: '同学'
    });
    await Query.factory('user_contacts_group').create({
      user_id: user_id,
      name: '同事'
    });

    await Query.factory().query('COMMIT');
    return user_id;
  } catch (err) {
    await Query.factory().query('ROLLBACK');
    return false;
  }
}
