'use strict';
const request = require('request');
const cheerio = require('cheerio');
const Promise = require('bluebird')


exports.stock = async (ctx) => {
  let query = [];
  if (ctx.query.wd.indexOf('||') > -1) {
    query = ctx.query.wd.split('||');
  } else {
    query.push(ctx.query.wd);
  }
  let records = [];
  for (let q of query) {
    let res = await getStock(q);
    if (res.stock) {
      records.push(res);
    }
  }
  ctx.data.result = records;
}

function getStock(data) {
  return new Promise((resolve, reject) => {
    return request.get('http://www.baidu.com.cn/s', {
      qs: {
        word: data
      }
    }, (err, res, body) => {
      if (err) return ctx.warning = err;
      const $ = cheerio.load(body);
      let stock = $('.op-stockdynamic-moretab-cur-num').text();
      let msg = $('.op-stockdynamic-moretab-cur-info').text();
      return resolve({stock, msg, name: data})
    })
  })
}
