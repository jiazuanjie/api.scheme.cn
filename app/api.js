const App = require('../core/app');
const loaders = require('../lib/loaders');
const bunyan = require('bunyan');
const path = require('path');
const delegates = require('delegates');
const config = require('../config');
const mysql = require('../lib/mysql');
const redis = require('../lib/redis');
const cors = require('@koa/cors');
const init = require('../middlewares/init');

const port = process.env.port || config.port || 3000;
const log_level = (process.env.LOG_LEVEL || 'info').toLowerCase();
const logger = bunyan.createLogger({
  name: 'cash',
  streams: [
    {stream: process.stdout, level: log_level},
    {path: path.resolve(__dirname, '../', 'logs', 'api.log'), level: 'debug'},
  ]
});

function loadModels(app, dir) {
  loaders.loadModules(dir).forEach((model) => {
    app.context.db.import(model);
  })
}

function boot(app) {
  app.log_level = log_level;
  app.context.db = mysql.connect(app.config.mysql);
  app.context.redis = redis.connect(app.config.redis);

  loadModels(app, path.resolve(__dirname, '../models'));

  delegates(app, 'context')
    .getter('db')
    .getter('redis');
  delegates(app.context, 'db')
    .getter('models');
}

const app = new App({
  logger,
  service: path.resolve(__dirname, '../service'),
  routes: path.resolve(__dirname, '../controller/api'),
  config,
});

boot(app);
app.loadServices();
app.use(init());
app.use(cors({'Access-Control-Allow-Origin': '*'}));

app.loadRouters();

if (require.main == module) {
  app.start(port, () => {
    logger.info('webot服务启动完成，端口：%d, 进程：%d, 环境：%s', port, process.pid, app.env);
  });
  
  process.on('SIGINT', () => app.terminate());
  process.on('SIGTERM', () => app.terminate());
}

module.exports = app;