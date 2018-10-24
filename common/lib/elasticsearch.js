'use strict';

let Promise = require('bluebird');
let request = Promise.promisifyAll(require('request'));

function SearchEngine(config) {
  this.ENDPOINT_SQL = `http://${config.host}/_sql`;
  this.client = config.client;
}

SearchEngine.prototype.setIndex = function(index) {
  this.index = index;
  return this;
}

SearchEngine.prototype.setType = function(type) {
  this.type = type;
  return this;
}

SearchEngine.prototype.bulk = function(data) {
  return this.client.bulk({body: data});
}

SearchEngine.prototype.count = function(filter) {
  return this.client.count({
    index: this.index,
    type: this.type,
    body: filter,
    ignore: [404]
  });
}

SearchEngine.prototype.delete = function(id) {
  return this.client.delete({
    index: this.index,
    type: this.type,
    id: id,
    ignore: [404]
  });
}

SearchEngine.prototype.createOrUpdate = function(data) {
  data.id = data.id || data._id;
  delete data._id;

  return this.client.update({
    index: this.index,
    type: this.type,
    id: data.id,
    body: {
      doc: data,
      doc_as_upsert: true
    }
  });
}

SearchEngine.prototype.search = function(filter) {
  let target, url;
  let params = {
    index: this.index,
    type: this.type,
    analyzeWildcard: true,
    from: filter.from,
    size: filter.size,
    ignore: [404]
  };

  if (filter.scroll) {
    params.scroll = filter.scroll;
  }

  let result = {
    scroll_id: false,
    items: [],
    counts: {
      page: filter.from / filter.size + 1,
      per_page: filter.size,
      total_items: 0,
      total_pages: 0,
      total_page: 0 //向后兼容
    }
  };

  if (filter.sql) {
    url =
      `${this.ENDPOINT_SQL}?sql=${filter.sql} LIMIT ${filter.from}, ${filter.size}`;
    target = request.getAsync(encodeURI(url)).then(resp=>JSON.parse(resp.body));
  } else if (filter.q) {
    params.q = filter.q;
    target = this.client.search(params);
  } else if (filter.body) {
    params.body = filter.body;
    target = this.client.search(params);
  }

  return target.then(resp=>{
    if (resp.status === 404)  return result;

    let total = resp.hits && resp.hits.total || 0;

    result.counts = Object.assign({}, result.counts, {
      total_items: total,
      total_pages: total ? Math.ceil(total / filter.size) : 0,
      total_page: total ? Math.ceil(total / filter.size) : 0
    });

    result = Object.assign({}, result, transformResponse(resp));
    return result;
  });
}

SearchEngine.prototype.scroll = function(params) {
  return this.client.scroll(params).then(transformResponse).catch(err => {
    console.log(err);
    return err;
  });
}

function transformResponse(resp) {
  let result = {};
  result.items = resp.hits.hits.map(record=>{
    record._source._id = record._source.id;
    delete record._source.id;
    return record;
  });
  if (resp._scroll_id) {
    result.scroll_id = resp._scroll_id;
  }
  return result;
}

module.exports = SearchEngine;
