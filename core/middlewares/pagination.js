'use strict';

module.exports = async (ctx, next) => {
  ctx.db._offset = 0;
  ctx.db._limit = 15;
  ctx.db._page = 1;
  const {per_page, page} = ctx.query;

  if (per_page && validator.isPosInt(per_page)) {
    if (per_page > 300) per_page = 300;
    ctx.db._limit = Number(per_page);
  }

  if (page && validator.isPosInt(page)) {
    ctx.db._offset = Math.round10((page - 1) * ctx.db._limit);
    ctx.db._page = Number(page);
  }

  await next();

  if (ctx.data && typeof ctx.data.count != 'undefined') {
    const count = ctx.data.count;
    delete ctx.data.count;
    ctx.data.counts = {
      page: ctx.db._page,
      per_page: ctx.db._limit,
      total_items: count,
      total_page: count > 0 && ctx.db._limit > 0 ? (Math.ceil(count / ctx.db._limit)) : 0,
    };
  }
};
