'use strict';
const _router = require('koa-router');
const {isLogin} = require('../../middlewares/access');

const router = new _router({
  prefix: '/api/feedback'
});

router.use('*', isLogin);

router.get('/list', async ctx => {
  let {items, count} = await ctx.service.App.findAllCount({
    attributes: {exclude: ['updated_at', 'deleted_at']},
    where: {
      user_id: ctx.state.uid
    }
  }, 'Feedback');

  ctx.data.items = items;
});

router.post('/create', async ctx => {
  const {content} = ctx.post;
  if (validator.isEmpty(content)) {
    ctx.warning = '内容不能为空';
  }
  await ctx.service.App.create({content, user_id: ctx.state.uid}, {}, 'Feedback')
  ctx.data.result = {affected: 1};
})

module.exports = router.middleware();