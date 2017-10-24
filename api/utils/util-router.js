const express = require('express');
const router = express.Router();
const controller = require('./util-controller');

router.get('/achievements', controller.achievements);


module.exports = router;