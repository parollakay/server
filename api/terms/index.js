const router = require('express').Router(),
      controller = require('./terms-controller')();
  
router.get('/all', controller.allTerms);
router.post('/newTerm', controller.newDefinition);
router.get('/search', controller.termSearch);
router.post('/:id/sentence', controller.addSentence);
router.delete('/:id/sentence/:sentenceId', controller.removeSentence);


module.exports = router;