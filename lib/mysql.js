const Sequelize = require('sequelize');

exports.connect = function connect({database, username, password, options}) {
  return new Sequelize(database, username, password, options);
};
