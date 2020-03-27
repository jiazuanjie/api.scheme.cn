const Service = require('../core/service');
const Config = require('../config');
const {moment, md5} = require('../lib/library')

module.exports = class User extends Service {
  constructor(ctx) {
    super(ctx);
    this.db = ctx.db;
    this.models = ctx.db.models;
    this.logger = ctx.logger;
  }

  async wxLogin(param) {
    let transaction = await this.db.transaction();
    try {
      let user = {};
      let userWeixin = await this.find({
        attributes: ['id', 'user_id'],
        where: {
          openid: param.openId
        },
        transaction
      }, 'UserWeixin');
      if (!userWeixin.id) {
        user = await this.models.User.create({
          username: param.nickName,
          nickname: param.nickName,
          password: '',
          sex: param.gender || 0,
          avatar_path: param.avatarUrl
        }, {transaction});
        await this.models.UserWeixin.create({
          openid: param.openId,
          nickname: param.nickName || '',
          gender: param.gender || 0,
          language: param.language,
          country: param.country,
          province: param.province,
          city: param.city,
          avatar_url: param.avatarUrl,
          user_id: user.id,
        }, {transaction});
        ['朋友', '同学', '同事'].forEach(item => async function () {
          await this.models.UserContactsGroup.create({
            user_id: user.id,
            name: item
          }, {transaction});
        })
      } else {
        user = await this.find({where: {id: userWeixin.user_id}, transaction});
      }
      await transaction.commit();

      let timestamp = new Date(moment().add(365, 'd').format('YYYY-MM-DD HH:mm:ss')) / 1000;
      user.access_token = md5(user.id.toString() + timestamp.toString() + Config.keys.newTokenkey);
      user.expire_timestamp = timestamp;

      return user;
    } catch (e) {
      await transaction.rollback();
      throw {warning: '登录失败'};
      this.logger.error(e.message);
    }
  }
};