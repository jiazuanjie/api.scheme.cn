const {Model} = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  class UserWeixin extends Model {}

  UserWeixin.init({
    id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    unionid: {
      type: DataTypes.CHAR(30),
      allowNull: false,
      defaultValue: ''
    },
    openid: {
      type: DataTypes.CHAR(30),
      allowNull: false
    },
    session_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    nickname: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: ''
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    gender: {
      type: DataTypes.INTEGER(1).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    country: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ''
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    language: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ''
    },
    is_deleted: {
      type: DataTypes.INTEGER(1).UNSIGNED,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'user_weixin',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    sequelize
  });

  return UserWeixin;
};
