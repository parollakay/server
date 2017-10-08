const winston = require('winston');
require('winston-loggly-bulk');

const { hashPass, validPass, authMiddleWare } = require('./passwordHash');
const { sendToUser, welcome, newDefinition, resetpassword, pwResetSuccess } = require('./emails')
winston.add(winston.transports.Loggly, { token: process.env.LOGGLY_TOKEN, subdomain: 'parollakay', tags: ['Winston-Nodejs'], json: true });

module.exports = {
  handleErr: (res, status, message) => {
    winston.log('Site Error', `${status} - ${message}`);
    return status === 500 ? res.status(500).send({ message: 'Server error with this operation.'}) : res.status(status).send({ message });
  },
  hash: (password) => hashPass(password),
  validate: (password, hash) => validPass(password, hash),
  isLoggedIn: (req, res, next) => authMiddleWare(req, res, next),
  sendEmail: {
    welcome: to => sendToUser(welcome, to),
    pwResetSuccess: to => sendToUser(pwResetSuccess, to),
    newDefinition: (to, term) => {
      const type = { subject: newDefinition.subject, html: newDefinition.html(term) }
      return sendToUser(type, to);
    },
    custom: (to, subject, html) => {
      const type = { subject, html }
      return sendToUser(type, to);
    },
    forgotPassword: (to, token) => {
      const type = { subject: resetpassword.subject, html: resetpassword.html(token) };
      return sendToUser(type, to);
    }
  }
}