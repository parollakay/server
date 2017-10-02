const winston = require('winston');
require('winston-loggly-bulk');

const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const emails = require('./emails');

winston.add(winston.transports.Loggly, {
  token: process.env.LOGGLY_TOKEN,
  subdomain: 'parollakay',
  tags: ['Winston-Nodejs'],
  json: true
});

const sendToUser = (type, to, subject, body) => {
  const from = {
    name: 'Jorge',
    email: 'jorge@parollakay.com'
  };
  return new Promise((resolve, reject) => {
    const msg = {
      to,
      from,
      subject: type.subject,
      html: type.html
    }
    sgMail.send(msg, (err, result) => err ? reject(err) : resolve(result));
  });
}

module.exports = {
  handleErr: (res, status, message) => {
    winston.log('Site Error', `${status} - ${message}`);
    return status === 500 ? res.status(500).send({ message: 'Server error with this operation.'}) : res.status(status).send({ message });
  },
  isLoggedIn: (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token) return handleErr(res, 403, 'You are not authorized to view this data.');
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) return handleErr(res, 403, 'You are not authorized to view this data.');
      req.decoded = decoded;
      next();
    })
  },
  sendEmail: {
    welcome: to => sendToUser(emails.welcome, to),
    newDefinition: (to, term) => {
      const type = {
        subject: emails.newDefinition.subject,
        html: emails.newDefinition.html(term)
      }
      return sendToUser(type, to);
    },
    custom: (to, subject, html) => {
      const type = {
        subject,
        html
      }
      return sendToUser(type, to);
    },
    forgotPassword: (to, token) => {
      const type = {
        subject: emails.resetpassword.subject,
        html: emails.resetpassword.html(token)
      }
      return sendToUser(type, to);
    },
    pwResetSuccess: to => sendToUser(emails.pwResetSuccess, to),
  }
}