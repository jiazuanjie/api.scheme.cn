const {Model} = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  class Feedback extends Model {}

  Feedback.init({
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
    content: {
      type: DataTypes.STRING(3000),
      allowNull: false,
      defaultValue: ''
    },
    reply_content: {
      type: DataTypes.STRING(3000),
      allowNull: false,
      defaultValue: ''
    },
    status: {
      type: DataTypes.INTEGER(1).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      get() {
        return moment(this.getDataValue('created_at')).format('YYYY-MM-DD HH:mm:ss')
      }
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
    tableName: 'feedback',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    sequelize
  });

  return Feedback;
};
