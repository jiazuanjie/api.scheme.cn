const redis = require('ioredis');

exports.connect = function connect(config) {
  return new redis(config);
};
