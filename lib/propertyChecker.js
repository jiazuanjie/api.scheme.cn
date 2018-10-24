'use strict';
let validator = require('./validator.js');

function PropertyChecker(data, attributes) {
  let properties = Object.keys(attributes);
  let errors = [];

  for(let property of properties)  {
    let type;

    if (!data.hasOwnProperty(property) ||!attributes.hasOwnProperty(property)) {
      continue;
    } else if (typeof attributes[property] === 'string') {
      type = attributes[property];
    } else {
      type = attributes[property].type;
    }
    if (!validator.isEmpty(data[property]) && !checkIt(type, data[property])) {
      errors.push({
        [property]: attributes[property]['description']||property,
        'message': (attributes[property]['description']|| property) + '类型不符',
        expected: `${type}`
      })
    }
    validate(data[property], property, attributes[property], errors);
  };

  if (errors.length) throw new Error(JSON.stringify(errors));
  return true;
}

const TYPE_CHECKERS = {
  id: checkID,
  number: checkNumber,
  date: checkDate,
  datetime: checkDateTime,
  boolean: checkBoolean,
  string: checkString,
  url: checkUrl
}

function checkIt(type, data) {
  return TYPE_CHECKERS[type](data);
};

function checkID(data) {
  return validator.isPosInt(data);
}

function checkNumber(data) {
  return Number(data).toString() != 'NaN';
}

function checkUrl(data) {
  return validator.isURL(data)
}

function checkDate(data) {
  let reg = /^\d{4}\-\d{2}\-\d{2}$/;
  if (data instanceof Date) {
    return true;
  } else {
    return reg.test(data) && new Date(data).toString() != 'Invalid Date';
  }
}

function checkDateTime(data) {
  let reg = /^\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}(:\d{2})?$/;
  if (data === '0000-00-00 00:00:00') {
    return true;
  } else if (data instanceof Date) {
    return true
  } else {
    return reg.test(data) && new Date(data).toString() != 'Invalid Date';
  }
}

function checkBoolean(data) {
  return validator.isBoolean(data);
}

function checkString(data) {
  return typeof data === 'string';
}

function validate(value, key, config, errors) {
  if (config.hasOwnProperty('min') && !checkMin(value, key, config, errors)) {
    return ;
  }
  if (config.hasOwnProperty('max') && !checkMax(value, key, config, errors)) {
    return ;
  }
  if (config.hasOwnProperty('in') && !checkInclusion(value, key, config, errors)) {
    return;
  }
}

function checkMin(value, key, config, errors) {
  if (config.type === 'string' && value.length < config.min) {
    errors.push((config.description || key)+ '长度不能小于'+config.min + '字符');
    return false;
  }
  if (config.type === 'number' && value < config.min) {
    errors.push((config.description || key) + '不能小于'+config.min)
    return false;
  }
  return true;
}

function checkMax(value, key, config, errors) {
  if (config.type === 'string' && value.length > config.max) {
    errors.push((config.description || key) + '长度不能大于'+config.max +'字符');
    return false;
  }
  if (config.type === 'number' && value > config.max) {
    errors.push((config.description || key) + '不能大于'+config.max);
    return false;
  }
  return true;
}

function checkInclusion(value, key, config, errors) {
  if (config.in.indexOf(value) === -1) {
    errors.push((config.description || key) + '可选值'+config.in);
    return  false;
  }
  return true;
}

module.exports = PropertyChecker;
