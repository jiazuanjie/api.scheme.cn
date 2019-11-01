const Router = require('koa-router');
const access = require('../middleware/access');

const contacts = require('../controllers/contacts');
const cashGift = require('../controllers/cash_gift');
const account = require('../controllers/account');
const piggyBank = require('../controllers/piggy_bank');
const userBank = require('../controllers/user_bank')
const login = require('../controllers/login');
const other = require('../controllers/other');
const support = require('../controllers/support');
const lover = require('../controllers/lover');
const feedback = require('../controllers/feedback')

const router = new Router({
  prefix: '/api'
});

router.post('/wxlogin', login.wxlogin);

//亲友录
router.get('/contacts/group/list', access.login, contacts.groupList);
router.post('/contacts/group/create', access.login, contacts.groupCreate);
router.post('/contacts/group/update', access.login, contacts.groupUpdate);
router.post('/contacts/group/setting', access.login, contacts.groupSetting)
router.post('/contacts/group/delete', access.login, contacts.groupDelete);
router.get('/contacts', access.login, contacts.contacts);
router.post('/contacts/create', access.login, contacts.contactCreate);
router.post('/contacts/update', access.login, contacts.contactUpdate);
router.post('/contacts/delete', access.login, contacts.contactDelete);
router.get('/contacts/info', access.login, contacts.contactInfo);

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
router.post('/cash_gift/logs/delete', access.login, cashGift.manage, cashGift.cashGiftLogsDelete);
router.get('/cash_gift/analyze', access.login, cashGift.analyze);
router.get('/cash_gift/signal', access.login, cashGift.signal);

//债款
router.get('/account/list', access.login, account.accountList)
router.post('/account/create', access.login, account.accountCreate)
router.post('/account/update', access.login, account.manage, account.accountUpdate)
router.post('/account/delete', access.login, account.accountDelete)
router.get('/account/detail', access.login, account.manage, account.accountDetail)
router.get('/account/logs', access.login, account.manage, account.accountLogs)
router.post('/account/logs/create', access.login, account.manage, account.accountLogsCreate)
router.post('/account/logs/update', access.login, account.accountLogsUpdate)
router.post('/account/logs/delete', access.login, account.accountLogsDelete)
router.get('/account/logs/detail', access.login, account.accountLogsDetail)


router.get('/feedback/list', access.login, feedback.lists);
router.post('/feedback/create', access.login, feedback.create);

module.exports = router;
