const Router = require('koa-router');
const access = require('../middleware/access');

const contacts = require('../controllers/contacts');
const cashGift = require('../controllers/cash_gift');
const account = require('../controllers/account');
const piggyBank = require('../controllers/piggy_bank');
const userBank = require('../controllers/user_bank')
const login = require('../controllers/login');
const other = require('../controllers/other');
const teacher = require('../controllers/teacher');

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

//存钱罐
router.get('/piggy_bank/list', access.login, piggyBank.list)
router.post('/piggy_bank/create', access.login, piggyBank.create)
router.post('/piggy_bank/update', access.login, piggyBank.manage, piggyBank.update)
router.post('/piggy_bank/setting', access.login, piggyBank.manage, piggyBank.setting)
router.post('/piggy_bank/delete', access.login, piggyBank.delete)
router.get('/piggy_bank/detail', access.login, piggyBank.manage, piggyBank.detail)
router.post('/piggy_bank/logs/create', access.login, piggyBank.manage, piggyBank.createLog)
router.post('/piggy_bank/logs/update', access.login, piggyBank.manage, piggyBank.updateLog)
router.post('/piggy_bank/logs/delete', access.login, piggyBank.manage, piggyBank.deleteLog)

//信用卡
router.get('/user/bank/list', access.login, userBank.list)
router.post('/user/bank/create', access.login, userBank.create)
router.post('/user/bank/update', access.login, userBank.manage, userBank.update)
router.post('/user/bank/delete', access.login, userBank.delete)

router.get('/teacher/classes', access.login, teacher.manage, teacher.classes);
router.post('/teacher/classes/set', access.login, teacher.manage, teacher.setClass);
router.post('/teacher/classes/change', access.login, teacher.manage, teacher.changeClass);

router.get('/stock', other.stock);
module.exports = router;