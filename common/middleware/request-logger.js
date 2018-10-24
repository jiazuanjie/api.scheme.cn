'use strict';

let bunyan = require('bunyan');
let uuid  = require('node-uuid');

module.exports = function(config) {
  let skip_req = config.skip_req;
  delete config.skip_req;
  let Logger = bunyan.createLogger(config);
  return function*(next) {
    let ctx = this;
    let res = this.res;
    let start = new Date()
    Logger.levels(0, ctx.app.LOG_LEVEL || 'info');
    this.logger = Logger.child({reqId: uuid.v4(), uid: this.header.uid ||0});
    if(!skip_req) {
      this.logger.info({req: this.request}, 'REQUEST');
    }

    let onfinish = done.bind(null, 'finish');
    let onclose = done.bind(null, 'close');
    res.once('finish', onfinish);
    res.once('close', onclose);

    try {
      yield next;
    } catch (err) {
      if (err.status && err.status >= 400 && err.status <500) {
        this.logger.warn(err.message);
      } else {
        this.logger.error(err);
      }
      this.status = err.status || 500;
      this.body = {message: err.message};
    }

    function done(event) {
      res.removeListener('finish', onfinish);
      res.removeListener('close', onclose);
      ctx.response.headers.duration = new Date() - start;
      ctx.response.method = ctx.req.method;
      ctx.response.url = ctx.req.url;
      let level = 'info';
      if (res.statusCode >= 400 && res.statusCode <500) {
        level = 'warn';
      } else if (res.statusCode >= 500) {
        level = 'error';
      }
      ctx.logger[level]({res: ctx.response}, 'RESPONSE');
    }
  };
}

