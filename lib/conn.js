const mysql = require('./mysql');
const config = require('../config');
const loaders = require('./loaders');
const path = require('path');
const _redis = require('../lib/redis');

exports.main = function () {
  let db = mysql.connect(config['mysql']);
  loaders.loadModules(path.resolve(__dirname, '../models')).forEach((model) => {
    db.import(model);
  });
  let redis = _redis.connect(config['redis']);
  return {db, redis}
};

exports.mysql = function () {
  let db = mysql.connect(config['mysql']);
  loaders.loadModules(path.resolve(__dirname, '../models')).forEach((model) => {
    db.import(model);
  });
  return db;
};

exports.redis = function () {
  let redis = _redis.connect(config['redis']);
  return redis;
};
