'use strict';
const validator = require('validator');

//常用方法
//是否为正整数
validator.isPosInt = function (str, options) {
  str = String(str);
  options = typeof (options) == 'object' ? options : {min: 1};
  options.min = options.min > 0 ? options.min : 1;
  return this.isInt(str, options);
};
//是否为整数
validator.isPosInt2 = function (str, options) {
  str = String(str);
  options = typeof options === 'object' ? options : {min: 1};
  options.min = options.min >= 0 ? options.min : 0;
  return this.isInt(str, options);
};
//判断是否为ID集合
validator.isIds = function (str) {
  return /^[0-9,]+$/.test(str);
};
//判断手机号码
validator.isMobile = function (str, area_code) {
  if (!str) {
    return false;
  } else if (typeof area_code === 'undefined' || area_code == 86) {
    return /^(10|13|14|15|16|17|18|19)\d{9}$/.test(validator.trim(str));
  } else {
    let len = str.toString().length;
    return len >= 5 && len <= 15 && validator.isInt(str, {min: 10000});
  }
};
//判断座机
validator.isTelPhone = function (str) {
  return str && /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/.test(str);
};
//是否为日期
validator.isDate = function (str) {
  return !!/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str);
};
//是否为时间
validator.isTime = function (str) {
  let reg = /^(\d{4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
  let reg2 = /^(\d{4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2})$/;
  return !!(reg.exec(str) || reg2.exec(str));
};
//是否为日期+时间
validator.isDateTime = function (str) {
  return !!(this.isDate(str) || this.isTime(str));
};
//是否为数组
validator.isArray = function (obj) {
  return obj && typeof obj === 'object' && Array == obj.constructor;
};
//判断是否为空
validator.isEmpty = function (str) {
  if (str === null || typeof str === 'undefined') {
    return true;
  } else if (typeof str === 'number') {
    return Number.isNaN(str) || str === 0;
  } else if (typeof str === 'string') {
    return str.trim().replace(/\s*/g, '').length === 0;
  } else if (typeof str === 'boolean') {
    return !str;
  } else if (Array === str.constructor) {
    return str.length === 0;
  } else if (typeof str === 'object' && (str instanceof Date)) {
    return false;
  } else if (typeof str === 'object') {
    return Object.keys(str).length === 0;
  } else {
    return true;
  }
};
//是否重复
validator.isRepeatNum = function (str) {
  let match = str.match(new RegExp(/(\w)\1+/g));
  return match && str == match[0];
};
//是否连续数字
validator.isContinueNum = function (str) {
  let num = parseInt(str[0]);
  if (parseInt(str[1]) > num) {
    for (let i = 1; i < str.length; i++) {
      if (parseInt(str[i]) - 1 !== num) {
        return false;
      }
      num = parseInt(str[i]);
    }
  } else {
    for (let i = 1; i < str.length; i++) {
      if (parseInt(str[i]) + 1 !== num) {
        return false;
      }
      num = parseInt(str[i]);
    }
  }
  return true;
};
//是否金额格式
validator.isMoney = function (str) {
  str = String(str);
  return str >= 0 && validator.isFloat(str) && /^\d+(?:\.\d{1,2})?$/.test(Math.abs(str));
};

module.exports = validator;