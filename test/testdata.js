'use strict';
const config = require('../config/config');

//测试接口域名
let host = 'http://localhost:3003/';
exports.host = host;

//获取token
exports.getTokens = function (uid) {
  let timestamp = new Date().getTime();
  return {
    'uid': uid ? uid : '',
    'appkey': 'wechat',
    'access-token': uid ? lib.md5(uid.toString() + timestamp.toString() + config['keys']['tokenKey']) : '',
    'expire-timestamp': timestamp
  }
}

