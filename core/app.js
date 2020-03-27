const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const path = require('path');
const delegates = require('delegates');
const loaders = require('../lib/loaders');
const init = require('./middlewares/init');
const requestLogger = require('./middlewares/request-logger');
const pagination = require('./middlewares/pagination');
global.validator = require('../lib/validator');
global.moment = require('moment');

module.exports = class App extends Koa {
  constructor(opts, ...params) {
    super(params);
    this.opts = opts || {};
    this.context.service = {};
    this.context.config = opts.config || {};
    this.context.logger = opts.logger;
    this.logger = opts.logger

    delegates(this, 'context')
      .getter('service')
      .getter('config');

    this.__defaultMiddlewares();
  }

  loadRouters() {
    loaders.loadModules(this.opts.routes).forEach(filepath => {
      this.logger.debug('loading route: %s', filepath);
      this.use(require(filepath));
    });
  }

  loadServices() {
    if (!this.context.service) {
      this.context.service = {};
    }
    let ctx = this.context;
    ctx.app = this;
    loaders.loadModules(this.opts.service).forEach(filepath => {
      let service = require(filepath);
      let serviceName = service.name || path.parse(filepath).name;
      this.logger.debug('loading service: %s, path: %s', serviceName, filepath);

      Object.defineProperty(this.context.service, serviceName, {
        get() {
          let instance = new service(ctx);
          return instance;
        },
      });
    })
  }

  __defaultMiddlewares() {
    this.use(init);
    this.use(bodyParser({
      jsonLimit: '20mb',
      formLimit: '20mb',
    }));
    this.use(requestLogger(this.opts.logger));
    this.use(pagination);
  }

  start(...args) {
    this.server = this.listen(...args);
  }

  terminate() {
    this.logger.warn('服务3秒后退出');
    this.server.close(() => setTimeout(() => process.exit(), 1));
  }
}