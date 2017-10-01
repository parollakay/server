const express = require('express'),
      logger = require('morgan'),
      path = require('path'),
      bodyParser = require('body-parser'),
      cors = require('cors');

module.exports = (app, config) => {
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(cors());
  app.use(express.static(config.rootPath + '/public'))
}
