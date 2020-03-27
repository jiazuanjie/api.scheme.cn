const {Model} = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  class UserContact extends Model {}

  UserContact.init({
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    group_id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: ''
    },
    nickname: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: ''
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
    tableName: 'user_contact',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    sequelize
  });

  return UserContact;
};
