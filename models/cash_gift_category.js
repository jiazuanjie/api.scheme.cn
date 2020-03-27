const {Model} = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  class CashGiftCategory extends Model {}

  CashGiftCategory.init({
    id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: ''
    },
    parent_id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    orderby: {
      type: DataTypes.INTEGER(2).UNSIGNED,
      allowNull: false,
      defaultValue: 99
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
    tableName: 'cash_gift_category',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    sequelize
  });

  return CashGiftCategory;
};
