'use strict';
let co = require('co');
var async = require('async');
let debug = require('debug')('lib:worker');
require('colors');

//队列同时处理并发数
let concurrency = 15;

//异步队列处理器
const worker = async.queue(function (task, callback) {
  co(task).then(function (value) {
    callback(null, value);
  }, function (err) {
    debug('任务处理失败 %s'.red, err.message);
    debug(err.stack.red);
    callback(err, null);
  });
}, concurrency);

//队列监听：当所有任务都执行完以后，将调用该函数
worker.saturated = function () {
  debug('开始后台任务处理！'.green);
}

//队列监听：当最后一个任务交给worker时，将调用该函数
worker.empty = function () {
  debug('后台添加完毕！'.yellow);
}

//队列监听：当所有任务都执行完以后，将调用该函数
worker.drain = function () {
  debug('所有后台任务执行完毕！'.blue);
}

//添加任务
worker.add = function (tasks) {
  if (typeof(tasks) === 'function') {
    this.push(tasks);
  } else if (typeof(tasks) === 'object' && Array == tasks.constructor) {
    this.push(tasks);
  } else if (typeof(tasks) === 'object') {
    for (let key in tasks) {
      this.push(tasks[key]);
    }
  }
}

module.exports = worker;