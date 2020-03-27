'use strict';

module.exports = class Service {
  constructor(ctx) {
    this.ctx = ctx;
    this.service = ctx.service;
  }

  async find(options, modelName) {
    modelName = modelName || this.constructor.name;
    const item = await this.models[modelName].findOne(options);
    return item ? item.toJSON() : {};
  }

  async findByPk(param, options = {}, modelName) {
    modelName = modelName || this.constructor.name;
    const item = await this.models[modelName].findByPk(param, options);
    return item ? item.toJSON() : {};
  }

  async findAll(options, modelName) {
    modelName = modelName || this.constructor.name;
    const items = await this.models[modelName].findAll(options);
    return items ? items.map(item => item.toJSON()) : [];
  }

  async findAllCount(options, modelName) {
    modelName = modelName || this.constructor.name;console.log(modelName)
    const count = await this.models[modelName].count({where: options.where});console.log(count)
    let items = [];
    if (count > 0) {
      items = await this.models[modelName].findAll(options);
      items = items.map(item => item.toJSON());
    }
    return {items, count};
  }

  async count(options, modelName) {
    modelName = modelName || this.constructor.name;
    const count = await this.models[modelName].count(options);
    return count || 0;
  }

  async create(value, options, modelName) {
    modelName = modelName || this.constructor.name;
    return this.models[modelName].create(value, options).then(model => {
      return model.toJSON();
    }).catch(err => {
      throw new Error(err.message);
    })
  }

  async update(values, options, modelName) {
    modelName = modelName || this.constructor.name;
    return this.models[modelName].update(values, options).then(res => {
      return res && res[0] ? res[0] : 0;
    }).catch(err => {
      throw new Error(err.message);
    })
  }

  async destroy(options, modelName) {
    modelName = modelName || this.constructor.name;
    return this.models[modelName].destroy(options).then(res => {
      return res || 0
    }).catch(err => {
      throw new Error(err.message);
    })
  }

  async findOrCreate(options, modelName) {
    modelName = modelName || this.constructor.name;
    return this.models[modelName].findOrCreate(options).then(res => {
      return res && res[0] ? res[0].toJSON() : null;
    }).catch(err => {
      throw new Error(err.message);
    })
  }

  async sum(field, options, modelName) {
    modelName = modelName || this.constructor.name;
    return this.models[modelName].sum(field, options);
  }

  async increment(field, options, modelName) {
    modelName = modelName || this.constructor.name;
    return this.models[modelName].increment(field, options);
  }

  async decrement(field, options, modelName) {
    modelName = modelName || this.constructor.name;
    return this.models[modelName].decrement(field, options);
  }
};