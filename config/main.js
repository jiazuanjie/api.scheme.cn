let env = process.env.NODE_ENV || 'local';
let config = require('./config.json');
let configEnv = require('./' + env + '/config.json');
config.env = env;
for (let key in configEnv){
  config[key] = configEnv[key];
}
module.exports = config;