
exports.port = 3000;

exports.mysql = {
  database: 'scheme',
  username: 'root',
  password: '123456',
  options: {
    port: 3306,
    dialect: 'mysql',
    pool: {
      max: 1,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+08:00',
  }
}

exports.redis = {
  port: 6379,
  host: 'dev.sosho.cn',
  password: 'usho85121608',
  db: 10
}

exports.mina = {
  appid: 'wx0f715f4a41fc38fe',
  secret: '6fad8da1c7258721dd1468cdf8077565'
}

exports.keys = {
  newTokenkey: 'abcd123'
};