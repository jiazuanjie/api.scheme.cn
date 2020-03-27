'use strict';

let uuid  = require('short-uuid');

module.exports = function(logger) {
  return async function(ctx, next) {
    let res = ctx.res;
    let start = new Date();
    logger.levels(0, ctx.app.log_level || 'info');
    ctx.logger = logger.child({reqId: uuid.generate(), uid: ctx.header.uid ||0});
    ctx.logger.info({req: ctx.request}, 'REQUEST');

    let onfinish = done.bind(null, 'finish');
    let onclose = done.bind(null, 'close');
    res.once('finish', onfinish);
    res.once('close', onclose);

    try {
      await next();
    } catch (err) {
      if (err.status && err.status >= 400 && err.status <500) {
        ctx.logger.warn(err.message);
      } else {
        ctx.logger.error(err);
      }
      ctx.status = err.status || 500;
      throw err;
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
};

