'use strict';
// let Mailer = require('./mailer');
// let mailer = Mailer();
let config = require('../config/main');
let debug = require('debug')('lib:monitor');
let os = require('os');

//服务重启间隔
let timeInterval = 0;

//系统监控和报警
module.exports = {
  restartTime: function () {
    timeInterval += 10000;
    debug('%d秒后重启该服务...'.yellow, timeInterval / 1000);
    return timeInterval;
  },
  resetTime: function () {
    timeInterval = 0;
  },
  sendErrorNotice: function (data) {
    data.to = data.to || config['report'].apiError;
    if (config.env === 'local' && config.env === 'dev') return false;
    mailer.send(data);
  },
  sendApiError: function (subject, error) {
    if (error && error.message === "mdb请求超时") return false;
    if (error && error.message.indexOf('connection') >= 0) return false;
    let body = '<h1>' + subject + '</h1>';
    body += '<div><em>HostName</em>:'+ os.hostname() +'</div>';
    body += '<div><em>ProcessId</em>:'+ process.pid +'</div>';
    body += '<h2>' + (error.errno ? '(' + error.errno + ')' : '') + error.message + '</h2>';
    body += '<div>' + error.stack + '</div>';
    if (config.env === 'local' || config.env === 'dev') {
      debug('本地及开发环境，忽略发送错误报告'.gray);
      return false;
    }
    // mailer.send({
    //   to: config['report'].apiError,
    //   subject: subject,
    //   body: body
    // })
  }
};
