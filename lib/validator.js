"use strict";
const validator = require('validator/validator');
const ObjectID = require('mongodb').ObjectID;

//常用方法
//是否为正整数
validator.isPosInt = function (str, options) {
  options = typeof(options) == 'object' ? options : {min: 1};
  options.min = options.min > 0 ? options.min : 1;
  return this.isInt(str, options);
}

validator.isPosInt2 = function (str, options) {
  options = typeof(options) == 'object' ? options : {min: 1};
  options.min = options.min >= 0 ? options.min : 0;
  return this.isInt(str, options);
}

validator.isPosFloat = function (str, options) {
  options = typeof(options) == 'object' ? options : {min: 0};
  options.min = options.min > 0 ? options.min : 0;
  return this.isFloat(str, options);
}

//判断是否为空白
validator.isBlank = function (str) {
  return (!str || /^\s*$/.test(str));
}

//是否为数组
validator.isArray = function (obj) {
  return obj && typeof obj === 'object' && Array == obj.constructor;
}

//判断是否为错误
validator.isError = function (obj) {
  return obj && typeof obj === 'object' && Error == obj.constructor;
}

//判断为手机号码
validator.isMobile = function (str, area_code) {
  if (!str) {
    return false;
  } else if (typeof(area_code) === 'undefined' || area_code == 86) {
    return /^(10|13|14|15|16|18|17|19)\d{9}$/.test(validator.trim(str));
  } else {
    let len = str.toString().length;
    return len >= 5 && len <= 15 && validator.isInt(str, {min: 10000});
  }
}
//判断是否为金额格式
// ^((0.0[1-9])|(0.[1-9][0-9]?)|([1-9][0-9]*(.\d{1,2})?))$/.test(0.00)
validator.isMoney = function (str) {
  return str >= 0 && validator.isFloat(str) && /^\d+(?:\.\d{1,2})?$/.test(Math.abs(str));
}
//判断是否为ID集合
validator.isIds = function (str) {
  return /^[0-9\,]+$/.test(str);
}
//判断是否为mongoID集合
validator.isMgoIds = function (str) {
  return /^[a-z0-9\,]+$/.test(str);
}
//值是否为用户名
validator.isUserName = function (str) {
  return true;
  //var test = /((^[\u4E00-\u9FA5]{2,6}$)|(^[a-zA-Z]+[\s\.]?([a-zA-Z]+[\s\.]?){0,4}[a-zA-Z]$))/;
  //return test.test(validator.trim(str));
}
//判断是否为合法的身份证号
validator.isIdentityCard = function (str) {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(str);
};
//值是否为一般账号
validator.isAccount = function (str) {
  var test = /^[a-zA-Z0-9_-]{3,25}$/;
  return test.test(validator.trim(str));
}
//是否包含html
validator.isHtml = function (str) {
  let reg = /<[^>]+>/;
  return reg.test(str);
}
//是否不为空
validator.notEmpty = function (str) {
  return this.isLength(str, 1);
}
//是否为日期
validator.isYmd = function (str) {
  let reg = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  return reg.exec(str) ? true : false;
}
//是否为时间
validator.isTime = function (str) {
  let reg = /^(\d{4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
  let reg2 = /^(\d{4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2})$/;
  return reg.exec(str) || reg2.exec(str) ? true : false;
}
//是否为日期
validator.isDate = function (str) {
  return this.isYmd(str) || this.isTime(str) ? true : false;
}
//转换为数字
validator.toInt = function (str) {
  return isNaN(str) ? 0 : parseInt(str);
}
//转换为数字
validator.toDate = function (str) {
  return isNaN(str) ? 0 : parseInt(str);
}
//判断值是否为空
validator.isEmpty = function (str) {
  if (str === null || typeof(str) === 'undefined') {
    return true;
  } else if (typeof(str) === 'number') {
    return str === NaN || str === 0;
  } else if (typeof(str) === 'string') {
    return str.trim().replace(/\s*/g, "").length === 0;
  } else if (typeof(str) == 'boolean') {
    return str ? false : true;
  } else if (Array === str.constructor) {
    return str.length == 0;
  } else if (typeof(str) === 'object' && (str instanceof Date)) {
    return false;
  } else if (typeof(str) === 'object') {
    return Object.keys(str).length === 0;
  } else {
    return true;
  }
}

//验证密码是否符合规范
validator.isCurPassword = function (str) {
  return /^(?=.*[A-Za-z])(?=.*\d)[0-9a-zA-Z]{6,16}$/.test(str);
}

let _isEmail = validator.isEmail;
validator.isEmail = function (value) {
  if (typeof value === 'string') {
    return /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/.test(value.trim());
  } else {
    return false;
  }
}

//判断是否为mongo主键ID
validator.isObjectId = function (str) {
  try {
    return ObjectID(str) ? true : false
  } catch (err) {
    return false
  }
}

//是否包含emoji表情符号
validator.isEmojiCharacter = function (substring) {
  for (var i = 0; i < substring.length; i++) {
    var hs = substring.charCodeAt(i);
    if (0xd800 <= hs && hs <= 0xdbff) {
      if (substring.length > 1) {
        var ls = substring.charCodeAt(i + 1);
        var uc = ((hs - 0xd800) * 0x400) + (ls - 0xdc00) + 0x10000;
        if (0x1d000 <= uc && uc <= 0x1f77f) {
          return true;
        }
      }
    } else if (substring.length > 1) {
      var ls = substring.charCodeAt(i + 1);
      if (ls == 0x20e3) {
        return true;
      }
    } else {
      if (0x2100 <= hs && hs <= 0x27ff) {
        return true;
      } else if (0x2B05 <= hs && hs <= 0x2b07) {
        return true;
      } else if (0x2934 <= hs && hs <= 0x2935) {
        return true;
      } else if (0x3297 <= hs && hs <= 0x3299) {
        return true;
      } else if (hs == 0xa9 || hs == 0xae || hs == 0x303d || hs == 0x3030
        || hs == 0x2b55 || hs == 0x2b1c || hs == 0x2b1b
        || hs == 0x2b50) {
        return true;
      }
    }
  }
}

module.exports = validator;
