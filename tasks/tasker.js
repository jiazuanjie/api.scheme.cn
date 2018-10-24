'use strict';

//二级任务队列
let Tasker = {};
Tasker.contacts = require("./contacts");
Tasker.cashgift = require('./cashgift');
Tasker.user = require('./user')

module.exports = global.Tasker = Tasker;