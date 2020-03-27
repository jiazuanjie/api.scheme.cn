const _router = require('koa-router');
const {isLogin} = require('../../middlewares/access');

const router = new _router({
  prefix: '/api/contacts'
});

router.get('/group/list', isLogin, async ctx => {
  ctx.data.result = await ctx.service.App.findAll({
    where: {user_id: ctx.state.uid},
  }, 'UserContactsGroup');
});

module.exports = router.middleware();