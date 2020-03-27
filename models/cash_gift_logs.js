const {Model} = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  class CashGiftLogs extends Model {}
  //const CashGift = sequelize.import('./cash_gift');

  CashGiftLogs.init({
    id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    user_id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    contact_id: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: ''
    },
    username: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: ''
    },
    group_id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
      get() {
        return Math.round10(this.getDataValue('amount') / 100, -2);
      }
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00'
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
    is_deleted: {
      type: DataTypes.INTEGER(1).UNSIGNED,
      allowNull: false,
      defaultValue: '0'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'cash_gift_logs',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    sequelize
  });

  CashGiftLogs.beforeValidate('beforeValidate', (model, options) => {
    let fields = options.fields || [];

    if (fields.includes('project_id') && !validator.isPosInt(model.project_id)) {
      throw new Error('请选择礼单');
    } else if (fields.includes('user_id') && !validator.isPosInt(model.user_id)) {
      throw new Error('登录出错，请重新登录');
    } else if (fields.includes('username') && validator.isEmpty(model.username)) {
      throw new Error('亲友姓名不能为空');
    } else if (fields.includes('amount') && model.amount === 0) {
      throw new Error('金额不能为空');
    }

  });

  return CashGiftLogs;
};
