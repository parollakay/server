const controller = require('./user-controller');
const router = require('express').Router();
const { isLoggedIn } = require('../utils');

router.post('/new', controller.register);
router.post('/auth', controller.Authenticate);
router.post('/forgotPass', controller.forgotPass);
router.post('/resetPass', controller.resetPass);
router.post('/subToWeeklyWord', controller.subscibeToWeeklyList);

router.get('/:id/autoAuth', isLoggedIn, controller.autoAuth);
router.post('/:id/addVote/:termId', isLoggedIn, controller.addVote);
router.post('/:id/minusVote/:termId', isLoggedIn, controller.minusVote);

router.get('/all', controller.all);
module.exports = router;