let env = process.env.NODE_ENV || 'local';

module.exports = require(`./config.${env}.js`)