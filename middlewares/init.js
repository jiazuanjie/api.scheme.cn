'use strict';

//初始化请求
//每个用户请求都不同
module.exports = function () {
  return async function (ctx, next) {
    ctx.logger.debug({req: ctx.request}, 'REQUEST');
    ctx.logger.info('URL', ctx.request.method, ctx.request.url);
    ctx.logger.info(ctx.request.headers, 'HEADERS');
    ctx.logger.info(ctx.query, 'QUERY');
    ctx.post = ctx.request.body || {};
    //空对象最终返回404
    ctx.data = {};
    ctx.logger.debug(ctx.request.body, 'BODY');

    try {
      await next();

      //输出模板
      if ('string' === typeof ctx.body) {
        //返回指定内容
      } else if ('object' === typeof(ctx.warning)) {
        ctx.logger.warn(ctx.warning.message);
        ctx.body = {status: 1, errno: ctx.warning.errno, result: {message: ctx.warning.message}};
      } else if (ctx.warning) {
        ctx.logger.warn(ctx.warning);
        ctx.body = {status: 1, errno: 1000, result: {message: ctx.warning}};
      } else if (ctx.data.result) {
        ctx.body = {status: 1, errno: 0, result: ctx.data.result};
      } else if (ctx.body && 'function' === typeof ctx.body.pipe) {
        //do nothing if the output is a stream
      } else if (ctx.body) {

      } else if (Object.keys(ctx.data).length) {
        ctx.data.status = 1;
        ctx.data.errno = 0;
        ctx.body = ctx.data;
      }
    } catch (err) {
      if ('object' === typeof(err.warning)) {
        ctx.logger.warn(err.warning.message);
        ctx.body = {status: 1, errno: err.warning.errno, result: {message: err.warning.message}};
      } else if (err.warning) {
        ctx.logger.warn(err.message);
        ctx.body = {status: 1, errno: err.errno || 1000, result: {message: err.warning}};
      } else {
        ctx.logger.error(err);
        ctx.body = {status: 1, errno: err.errno || 500, result: {message: err.message}};
      }
    }
  };
};

