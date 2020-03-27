const {Model} = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  class User extends Model {}

  User.init({
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    password: {
      type: DataTypes.CHAR(32),
      allowNull: false,
      defaultValue: ''
    },
    sex: {
      type: DataTypes.INTEGER(1).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    nickname: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: '0000-00-00'
    },
    avatar_path: {
      type: DataTypes.STRING(250),
      allowNull: false,
      defaultValue: ''
    },
    authKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    accessToken: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    is_closed: {
      type: DataTypes.INTEGER(1).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    last_visit_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    last_login_ip: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: ''
    },
    is_deleted: {
      type: DataTypes.INTEGER(1).UNSIGNED,
      allowNull: false,
      defaultValue: '0'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    sequelize
  });

  return User;
};
