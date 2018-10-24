'use strict';
let _amqp = require('amqplib');
let mconfig = require('../config/main');
let debug = require('debug')('lib:rabbitmq');

const amqplib = module.exports = function () {
  this.conn = null;
}

amqplib.prototype.createConn = function (globalName) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _amqp.connect(mconfig['rabbitmq']['url']).then(function (conn) {
      let channel = conn.createChannel();
      channel.then(function (ch) {
        global[globalName] = ch;
      })
      _this.conn = channel;
      debug('%s连接成功' . green, globalName);
      return resolve(true);
    }, function (err) {
      debug('%s连接出错' . red, globalName);
      return reject(err);
    })
  })
}