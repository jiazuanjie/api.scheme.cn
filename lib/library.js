"use strict";
let crypto = require('crypto');
let cryptLib = require('cryptlib');
let moment = require("moment");
let config = require("../config/main");
let xss = require('xss');
let validator = require('./validator');

moment.locale('zh-cn');

const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

//ios平台加密
const iosCipher = {
  encrypt: function (str) {
    return cryptLib.encrypt(str, config.keys.aesKey, config.keys.aesIv);
  },
  decrypt: function (str) {
    return cryptLib.decrypt(str, config.keys.aesKey, config.keys.aesIv);
  }
}

//java、js语言加密解密
const androidCipher = {
  encrypt: function (str) {
    var cipher = crypto.createCipher('aes-128-ecb', config.keys.aesKey);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
  },
  decrypt: function (str) {
    var decipher = crypto.createDecipher('aes-128-ecb', config.keys.aesKey);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }
}

//php平台加密
const phpCipher = {
  iv: '1234567890000000',
  cryptkey: crypto.createHash('sha256').update('__tazai_wolf__key').digest(),
  encrypt: function (str) {
    let encipher = crypto.createCipheriv('aes-256-cbc', this.cryptkey, this.iv);
    let encoded = encipher.update(str, 'utf8', 'base64');
    encoded += encipher.final('base64');
    return encoded;
  },
  decrypt: function (str) {
    let decipher = crypto.createDecipheriv('aes-256-cbc', this.cryptkey, this.iv);
    let decoded = decipher.update(str, 'base64', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
  }
}

//其他常用方法
const lib = {
  moment: moment,
  md5: function (str) {
    //node4.0, 默认encoding为 'binary'
    //node6.0,若data 为字符串，默认encoding 为 ‘utf8’
    return crypto.createHash('md5').update(str).digest('hex');
  },
  //aes加密
  encrypt: function (str, appkey) {
    if (appkey == 'ios') {
      return iosCipher.encrypt(str);
    } else if (appkey == 'website') {
      return phpCipher.encrypt(str);
    } else if (['android', 'pwsite', 'mwsite', 'owsite', 'openapi'].indexOf(appkey) >= 0) {
      return androidCipher.encrypt(str);
    } else if (appkey == 'test') {
      return str;
    } else {
      return '';
    }
  },
  //aes解密
  decrypt: function (str, appkey) {
    if (appkey == 'ios') {
      return iosCipher.decrypt(str);
    } else if (appkey == 'website') {
      return phpCipher.decrypt(str);
    } else if (['android', 'pwsite', 'mwsite', 'owsite', 'openapi'].indexOf(appkey) >= 0) {
      return androidCipher.decrypt(str);
    } else {
      return '';
    }
  },
  //账户密码
  password: function (str) {
    return this.md5(config.keys.passKey + str);
  },
  //格式化数据
  jsonFormat: function (json) {
    for (let key in json) {
      if (['jpush_id', 'org_id', 'file_id'].indexOf(key) >= 0) {
        json[key] = json[key] ? json[key] : '';
      } else if (key === 'password' || key === 'is_deleted' || key.substr(0, 1) === '_') {
        delete json[key];
      } else if (['sex', 'id'].indexOf(key) >= 0 || key.indexOf('_id') >= 0 || key.indexOf('_num') >= 0 || key.indexOf('_year') >= 0) {
        json[key] = json[key] ? parseInt(json[key]) : 0;
      } else if (key.indexOf('_at') > -1) {
        json[key] = json[key] ? this.dateFormat(json[key], 'YYYY-MM-DD HH:mm:ss') : '';
      } else if (key.indexOf('start_date') > -1 || key.indexOf('end_date') > -1) {
        json[key] = this.dateFormat(json[key], 'YYYY-MM-DD HH:mm:ss');
      } else if (key.indexOf('_date') > -1 || key === 'birthday') {
        json[key] = this.dateFormat(json[key], 'YYYY-MM-DD');
      } else if (/^is_/.test(key)) {
        json[key] = json[key] == 1 ? true : false;
      } else if (key.indexOf('city_name') > -1) {
        json[key] = json[key] ? json[key].replace('市', '') : '';
      } else if (json[key] === null) {
        json[key] = '';
      }
    }
    return json;
  },
  /**
   * 格式化数组对象
   * @param {Array[Object|primary type]} array
   * @returns {Array}
   */
  arrayFormat: function (array) {
    for (let i = 0, l = array.length; i < l; i++) {
      if (typeof array[i] === 'object') {
        this.jsonFormat(array[i]); //传入引用类型的对象
      }
    }
    return array;
  },

  /**
   * 数据格式化,
   * @param obj
   * @returns {*}
   */
  dataFormat: function (obj) {
    if (typeof obj !== 'object') {
      return obj;
    } else if (Array === obj.constructor) {
      return this.arrayFormat(obj);
    } else {
      return this.jsonFormat(obj);
    }
  },
  //获取当前时间
  datetime: function (format) {
    return moment().format(format ? format : 'YYYY-MM-DD HH:mm:ss');
  },
  //日期格式化
  dateFormat: function (date, format) {
    let sdate = date ? new Date(date) : 'Invalid Date';
    format = format ? format : 'YYYY-MM-DD HH:mm:ss';
    date = sdate != 'Invalid Date' ? moment(sdate).format(format) : '';
    return date.indexOf('1899-11-30') >= 0 ? '' : date;
  },
  //JSON对象合并
  extend: function (destination, source) {
    for (let key of Object.keys(source)) {
      destination[key] = source[key];
    }
    return destination;
  },
  //返回时间戳
  timestamp: function (str) {
    if (!str) {
      return parseInt(new Date() / 1000);
    } else if (str == '0000-00-00 00:00:00') {
      return '';
    } else {
      return parseInt(new Date(Date.parse(str)) / 1000);
    }
  },
  //分割符号，并去重
  split: function (str) {
    let res = typeof(str) === 'string' ? str.split(',') : '';
    let json = {};
    for (let val of res) {
      if (val) {
        json[val] = val;
      }
    }
    return Object.keys(json);
  },
  //延迟promise
  //单位毫秒
  delay: function* (time) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(true);
      }, time);
    });
  },
  delay2: function (time) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(true);
      }, time);
    });
  },
  //随机生成验证码字符串
  randomNum: function (max, min) {
    var Range = max - min;
    var Rand = Math.random();
    return (min + Math.round(Rand * Range)).toString();
  },
  //普通文本内容过滤;
  textFilter: function (val) {
    if (val && typeof(val) === 'string') {
      return val.replace(/<[^<>]+>/g, '', 0);
    } else {
      return val;
    }
  },
  //过滤空格
  trim: function (str) {
    if ('string' === typeof(str)) {
      return str.trim().replace(' ', '').replace(/\s+/g, '');
    } else {
      return str;
    }
  },
  //富文本过滤
  richTextFilter: function (val) {
    if (val && typeof(val) === 'string') {
      val = val.replace(/<script[\s\S]*?<\/script>/ig, '', 0);
    }
    return val;
  },
  //sql安全过滤;
  safeFilter: function (val) {
    if (val && typeof(val) === 'string') {
      return val.replace(/<[^<>]+>|\\|drop|alter|insert|delete|update|`|'|"/ig, '', 0);
    } else if (val && typeof(val) === 'object' && Array === val.constructor) {
      return val.map(v => this.safeFilter(v));
    } else {
      return val;
    }
  },
  //删除对象指定键
  delObjKeys: function (obj, keys) {
    if (typeof(obj) === 'object' && typeof(keys) === 'object' && keys.length) {
      for (let k of keys) {
        if (obj.hasOwnProperty(k)) {
          delete obj[k];
        }
      }
    }
  },
  //数组祛重
  arrayUnique: function (data) {
    var n = [];
    for (var i = 0; i < data.length; i++) {
      if (n.indexOf(data[i]) === -1) n.push(data[i]);
    }
    return n;
  },
  //数组对象祛重
  arrayObjUnique: function (items, prop) {
    prop = prop || 'id'
    let hash = {};
    items = items.reduce((item, next) => {
      hash[next[prop]] ? '' : hash[next[prop]] = true && item.push(next);
      return item
    }, [])
    return items
  },
  //删除对象中null值为''
  replaceNull: function (data) {
    if (!data) return {};
    let keys = Object.keys(data);
    for (let k of keys) {
      data[k] = data[k] === null ? '' : data[k];
    }
    return data;
  },
  //返回用户登录信息
  loginUser: function (user) {
    if (user.id) {
      let timestamp = new Date(moment().add(365, 'd').format('YYYY-MM-DD HH:mm:ss')) / 1000;
      user.access_token = this.md5(user.id.toString() + timestamp.toString() + config.keys.newTokenkey);
      user.expire_timestamp = timestamp;
    }
    return user;
  },
  //过滤空字符串
  parseFilter: function (params) {
    return Object.keys(params).reduce(function (init, key) {
      if (params[key] === '' ||
        params[key] === null ||
        params[key] === undefined) return init;
      init[key] = params[key];
      return init;
    }, {});
  },
  //转换为金额
  toMoney: function (num) {
    return parseFloat(num).toFixed(2) * 1;
  },
  //增加数字0前缀
  prefixInteger(num, n) {
    return (Array(n).join(0) + num).slice(-n);
  },
  //拼接签名字符串
  linkSignStr: function (params, link) {
    link = undefined === link ? '=' : link;
    params = this.parseFilter(params);
    return Object.keys(params).sort().reduce(function (sorted, key) {
      if (typeof params[key] === 'object') params[key] = JSON.stringify(params[key]);
      sorted.push(`${key}${link}${params[key]}`);
      return sorted;
    }, []).join('&');
  },
  //生成RSA-SHA1签名
  //privateKey为buffer
  createRSASign: function (params, privateKey) {
    let signer = crypto.createSign('RSA-SHA1');
    let prestr = this.linkSignStr(params);
    let sign = signer.update(new Buffer(prestr, 'utf-8')).sign(privateKey, 'base64');
    return sign;
  },
  //验证RSA-SHA1签名
  //publicKey为buffer
  verifyRSASign: function (params, sign, publicKey) {
    let verify = crypto.createVerify('RSA-SHA1');
    return verify.update(new Buffer(this.linkSignStr(params), 'utf-8')).verify(publicKey, sign, 'base64');
  },
  //生成RSA2签名
  createRSA2Sign: function (params, privateKey) {
    let signer = crypto.createSign('RSA-SHA256');
    let prestr = this.linkSignStr(params);
    return signer.update(new Buffer(prestr, 'utf-8')).sign(privateKey, 'base64');
  },
  parseBoolean: function (value) {
    if (typeof value === 'string' && (value === 'true' || value === '1')) {
      return true;
    } else if (typeof value === 'number' && value === 1) {
      return true;
    } else if (typeof value === 'boolean') {
      return value;
    }
    return false;
  },

  //排名从高到低
  rankOptions: function (options, order) {
    let rank = 0;
    let count = 1;
    let totalCount = options.reduce((sum, option) => (sum += option.count), 0);
    options = options.sort((a, b) => {
      if (a.count < b.count) return 1;
      if (a.count > b.count) return -1;
      return 0;
    }).map((option, idx) => {
      if (idx === 0 || option.count < options[idx - 1].count) {
        rank = count;
      }
      ++count;
      option.rank = rank;
      option.percentage =
        option.count ? Math.round10(option.count / totalCount * 100, -2) + '%' : '0%';
      return option;
    });

    if (!order) options = options.sort((a, b) => a.order - b.order);
    if (order === 'ASC') options = options.sort((a, b) => a.count - b.count);

    return options;
  },
  toArray: function (data) {
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'string') {
      try { return JSON.parse(data); } catch (e) { return []; }
    } else if (typeof data === 'object' && data != null) {
      let len = Object.keys(data).length;
      data.length = len;
      return [].slice.call(data);
    } else {
      return [];
    }
  },
  // + - = && || > < ! ( ) { } [ ] ^ " ~ * ? : \ /
  // :暂时去除
  esEscape: function (query) {
    let reg = new RegExp(/([+\-=\&\|}><!()\{\}\[\]^\"~\*\?\\\/])/g);
    return (query || '').replace(reg, '\\$1').trim();
  },
  getErrMessage: function (error) {
    try {
      error.message = JSON.parse(error.message);
      return error.message[0]['message'] || error.message[0];
    } catch (err) {
      return error.message;
    }
  },
  isValidEmail: function (email) {
    let emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return validator.isAscii(email) && emailReg.test(email);
  },
  saveParse: function (value, defaultValue) {
    try {
      return JSON.parse(value);
    } catch (err) {
      return defaultValue;
    }
  },
  removeEmojis: function (str) {
    return str.replace(emojiRegex, '');
  },
  //根据长度截取先使用字符串，超长部分追...
  cutstr: function (str, len, over) {
    let strlen = 0, s = "";
    over = over ? over : '...';
    if (str.length * 2 <= len) return str;
    for (let i = 0; i < str.length; i++) {
      s = s + str.charAt(i);
      if (str.charCodeAt(i) > 128) {
        strlen = strlen + 2;
        if (strlen >= len) {
          return s.substring(0, s.length - 1) + over;
        }
      } else {
        strlen = strlen + 1;
        if (strlen >= len) {
          return s.substring(0, s.length - 2) + over;
        }
      }
    }
    return s;
  },
  //判断是否是数值型,包括数值字符串
  isNumber: function (num) {
    num = Number(num)
    return typeof num === 'number' && !isNaN(num)
  },
  //判断是否是正整数,包括数值字符串
  isPositiveInt: function (num) {
    num = Number(num)
    return /^\d+$/.test(num) && num > 0
  }
};

// Closure
(function () {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function (value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function (value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function (value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();
module.exports = lib;
