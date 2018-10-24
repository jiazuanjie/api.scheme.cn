const Router = require('koa-router');
const access = require('../middleware/access');

const cashGift = require('../controllers/cash_gift');
const contacts = require('../controllers/contacts');

const router = new Router({
  prefix: '/api'
});

//亲友录
router.get('/contacts/group/list', access.login, contacts.groupList);

//礼金管家
router.get('/cash_gift/type', cashGift.cashGiftType);
router.get('/cash_gift/list', access.login, cashGift.cashGiftList);
router.post('/cash_gift/create', access.login, cashGift.cashGiftCreate);
router.post('/cash_gift/update', access.login, cashGift.manage, cashGift.cashGiftUpdate);
router.post('/cash_gift/delete', access.login, cashGift.cashGiftDelete);
router.get('/cash_gift/detail', access.login, cashGift.manage, cashGift.cashGiftDetail);
router.post('/cash_gift/logs/create', access.login, cashGift.manage, cashGift.cashGiftLogsCreate);
router.post('/cash_gift/logs/update', access.login, cashGift.cashGiftLogsUpdate);
router.get('/cash_gift/logs/detail', access.login, cashGift.cashGiftLogsDetail);
router.post('/cash_gift/logs/delete', access.login, cashGift.cashGiftLogsDelete);

module.exports = router;