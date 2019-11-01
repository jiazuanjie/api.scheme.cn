"use strict";
global.Promise = require('bluebird');
const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');
const config = require('./config/main');
const init = require('./middleware/init');
const access = require('./middleware/access');
const LoggerWatcher = require('./common/lib/log-watcher');
const Logger = require('./common/middleware/request-logger');
const path = require('path');

Error.stackTraceLimit = 3;
require('./tasks/tasker');
require('./lib/worker');

app.env = config.env;
app.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

LoggerWatcher('./log_level', [app]);

app.use(bodyParser());
app.use(Logger({
    name: 'API',
    skip_req: true,
    streams: [
        {stream: process.stdout, level: 'info'},
        {path: path.resolve(__dirname, 'logs', 'api.log'), level: 'debug'}
    ],
    serializers: { res: resSerializer }
}))

// 初始化请求
app.use(init());

app.use(access.auth());
const router = require('./routers/main');
app.use(router.routes()).use(router.allowedMethods());

//启动普通数据接口服务
let server = app.listen(config.port);
console.log('  基本接口启动成功，端口:%d 进程:%d 模式:%s'.green, config.port, process.pid, app.env);

function resSerializer(res) {
  if (!res || (!res.statusCode && !res.status))
    return res;
  return {
    statusCode: res.statusCode || res.status,
    header: res._header || res.header,
    method: res.method,
    url: res.url
  }
}

 process.on('SIGINT', (err)=>{
   if (err) {
     console.log(err, '进程停止失败，强制退出!');
     return process.exit(1);
   }
   console.log('接收服务停止信号，3秒后退出!');
   server.close(()=>{ setTimeout(()=> process.exit(), 3000) });
   setTimeout(()=>process.exit(), 10 * 1000);
 });

module.exports = app
