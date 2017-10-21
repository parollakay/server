const router = require('express').Router();
const controller = require('./terms-controller')();
const { isLoggedIn } = require('../utils');

router.get('/all', controller.allTerms);
router.get('/search', controller.termSearch);
router.get('/tag', controller.tagSearch);

router.post('/newTerm', isLoggedIn, controller.newDefinition);
router.post('/:id/reportTerm', isLoggedIn, controller.addIncidence);
router.post('/:id/sentence', isLoggedIn, controller.addSentence);
router.delete('/:id/sentence/:sentenceId', isLoggedIn, controller.removeSentence);


module.exports = router;