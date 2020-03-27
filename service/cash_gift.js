const Service = require('../core/service');

module.exports = class CashGift extends Service{
  constructor(ctx) {
    super(ctx);
    this.db = ctx.db;
    this.models = ctx.db.models;
  }
}