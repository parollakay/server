const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const emails = require('./emails');

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
    return status === 500 ? res.status(500).send({ message: 'Server error with this operation.'}) : res.status(status).send({ message });
  },
  
  sendEmail: {
    welcome: (to) => sendToUser(emails.welcome, to),
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
    forgotPassword: (to, token) => {},
    pwResetSuccess: (to) => {},
    deleteAccount: (to) => {},
  }
}