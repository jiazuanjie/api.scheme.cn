const crypto = require('crypto');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

class Mina {
  constructor({appid, secret, access_token}) {
    this.appid = appid;
    this.secret = secret;
    this.access_token = access_token;
  }

  decryptData({encryptedData, iv, session}) {
    session = new Buffer(session, 'base64');
    encryptedData = new Buffer(encryptedData, 'base64');
    iv = new Buffer(iv, 'base64');

    let decoded;
    try {
      let decipher = crypto.createDecipheriv('aes-128-cbc', session, iv);
      decipher.setAutoPadding(true);
      decoded = decipher.update(encryptedData, 'base64', 'utf8');
      decoded += decipher.final('utf8');
      decoded = JSON.parse(decoded);
    } catch (err) {
      throw err;
    }

    if (decoded.watermark.appid !== this.appid) {
      throw new Error('可疑请求');
    }

    return decoded;
  }

  getSession(code) {
    return request.getAsync({
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      json: true,
      qs: {
        appid: this.appid,
        secret: this.secret,
        js_code: code,
        grant_type: 'authorization_code',
        lang: 'zh_CN'
      }
    }).then(res => res.body.session_key)
  }
}

module.exports = Mina;