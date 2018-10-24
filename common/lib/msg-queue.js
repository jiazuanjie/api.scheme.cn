"use strict";
const amqp = require("amqplib");

//消息队列
class MsgQueue {

  constructor(options) {
    this._conn = null;
    this._channels = {};
    this._options = Object.assign({}, {
      durable: true,
      address: 'amqp://localhost:5672'
    }, options || {});
    this._client = amqp.connect(this._options.address);
  }

  /**
   * 连接服务
   * @return {Promise}
   */
  conn() {
    let _this = this;
    return this._client
      .then(function (conn) {
        _this._conn = conn;
        return Promise.resolve(_this._conn);
      }).catch(function (err) {
        return Promise.reject(err);
      });
  }

  /**
   * 获取指定channel
   * 默认获取名为default的channel
   * @return {Object}
   */
  channel(name) {
    return this._channels[name || "default"];
  }

  /**
   * 创建channel
   * 默认名称为default
   * @return {Promise}
   */
  createChannel(name) {
    return this._conn.createChannel().then(ch => {
      return (this._channels[name || "default"] = ch);
    });
  }

  /**
   * 创建确认channel
   * 默认名称为default
   * @return {Promise}
   */
  createConfirmChannel(name) {
    return this._conn.createConfirmChannel().then(ch => {
      return (this._channels[name || "confirm"] = ch);
    });
  }

}

/**
 * 快速创建服务
 * 自动创建默认channel
 * 指定queue可同时一个申明队列
 * @purview public
 * @param {String} address
 * @param {String} queue 默认队列名称
 * @param {Boolean} durable,默认true
 * @return {MsgQueue}
 */
exports.factory = function (options) {
  const mq = new MsgQueue(options);
  return mq.conn().then(conn => mq.createChannel()).then(ch => {
    if (options.queue) ch.assertQueue(options.queue, {durable: mq._options.durable});
    return mq;
  })
};

/**
 * 示例:
 *
 const MQ = require('../lib/msg-queue');
 co(function* () {

  //快速创建一个监听服务+默认通道+消息申明
  const mq = yield MQ.factory({
    address: "amqp://localhost:5672/",
    queue: queueName
  });

  //使用默认channel发送消息，返回true
  let result = mq.channel().sendToQueue("queue1", new Buffer("text"));

  //使用默认channel接收消息
  mq.channel().consume("queue1", function (msg) {
   if (msg !== null) {
      console.log(msg.content.toString());
      //确认应答
      mq.channel().ack(msg);
   }
  });

  //申明更多通道
  yield mq.createChannel('channel2);
  yield mq.createChannel('channel3);
  yield mq.createChannel('channel4...);

  //使用channel2
  mq.channel('channel2').consume("other_queue", function (msg) {
   if (msg !== null) {
      console.log(msg.content.toString());
      //确认应答
      mq.channel().ack(msg);
   }
  });

});

 */