"use strict";
let crypto = require('crypto');
let cryptLib = require('cryptlib');
let moment = require("moment");
let config = require("../config/main");
let xss = require('xss');
let validator = require('./validator');
const pinyin = require('pinyin')

moment.locale('zh-cn');

const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

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
      if (['contact_id'].indexOf(key) >= 0) {
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
      } else if (key.indexOf('_amount') > -1 || key === 'amount') {
        json[key] = json[key] ? (json[key] / 100) : 0;
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
  //增加数字0前缀
  prefixInteger(num, n) {
    return (Array(n).join(0) + num).slice(-n);
  },
  getErrMessage: function (error) {
    try {
      error.message = JSON.parse(error.message);
      return error.message[0]['message'] || error.message[0];
    } catch (err) {
      return error.message;
    }
  },
  //获取汉字首字母
  getFirstLetter: function (params) {
    return pinyin(params.slice(0, 1), {style: pinyin.STYLE_FIRST_LETTER})[0][0]
  },
  //获取指定时间所在星期
  getWeek: function (date) {
    date = date ? new Date(Date.parse(date)) : new Date();
    return date.getDay()
  },
  //根据星期获取本周时间
  getDateFromWeek: function (week, format = 'YYYY-MM-DD') {
    if (week == '') return '';
    let toWeek = new Date().getDay();
    return lib.moment().subtract(parseInt(toWeek) - parseInt(week), 'd').format(format);
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
