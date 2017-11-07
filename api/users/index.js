const controller = require('./user-controller');
const router = require('express').Router();
const { isLoggedIn, isAdmin } = require('../utils');

router.post('/new', controller.register);
router.post('/auth', controller.Authenticate);
router.post('/forgotPass', controller.forgotPass);
router.post('/resetPass', controller.resetPass);
router.post('/subToWeeklyWord', controller.subscibeToWeeklyList);


router.get('/:id/populatedUser', isLoggedIn, controller.populatedUser);
router.post('/:id/changePassword', isLoggedIn, controller.changePassword);
router.get('/:id/autoAuth', isLoggedIn, controller.autoAuth);
router.post('/:id/addVote/:termId', isLoggedIn, controller.addVote);
router.post('/:id/minusVote/:termId', isLoggedIn, controller.minusVote);
router.post('/:id/makeSuper', isLoggedIn, controller.makeSuper);

router.get('/latestUsers', isLoggedIn, isAdmin, controller.getRecent);

router.put('/:id/notification_read/:notification', isLoggedIn, controller.markNotificationRead);
router.delete('/:id/notification_delete/:notification', isLoggedIn, controller.deleteNotification);
router.delete('/:id/notifications_clear', isLoggedIn, controller.clearAllNotifications);
router.post('/:id/togl_notifications/likes', isLoggedIn, controller.tgl_notification_for_likes);
router.post('/:id/togl_notifications/sentences', isLoggedIn, controller.tgl_notification_for_sentences);
router.post('/:id/togl_notifications/achievements', isLoggedIn, controller.tgl_notification_for_achievements);
router.post('/:id/notifications_off', isLoggedIn, controller.notifications_off);

router.post('/:id/saveTerm/', isLoggedIn, controller.saveTerm);
router.post('/:id/unsaveTerm/:term', isLoggedIn, controller.unsaveTerm);
// router.post('/:id/addNoteToSavedTerm/:term', isLoggedIn, controller.addNoteToSavedTerm);
// router.put('/:id/editSavedTermNote/:term', isLoggedIn, controller.editSavedTermNote);
// router.delete('/:id/deleteSavedTermNote/:term', isLoggedIn, controller.deleteSavedTermNote)

router.get('/all', controller.all);
module.exports = router;