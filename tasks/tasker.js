'use strict';

//二级任务队列
let Tasker = {};
Tasker.contacts = require("./contacts");
Tasker.cashgift = require('./cashgift');
Tasker.user = require('./user');
Tasker.account = require('./account')
Tasker.piggyBank = require('./piggyBank')

module.exports = global.Tasker = Tasker;