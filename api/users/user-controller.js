const async = require('async');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const bcrypt = require('bcrypt');
const User = require('./user-model');
const Term = require('../terms/terms-model');
const { handleErr, sendEmail, validate } = require('../utils');
const { validPass } = require('../utils/passwordHash')

module.exports = {
  // Auth Stuff
  register: (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return handleErr(res, 422, 'Please fill in all fields.');
    User.find({ $or: [{ email }, { username }]}, (err, users) => {
        if (err) return handleErr(res, 500);
        if (users.length < 0) return res.status(409).send({ message: 'A user already exists with either this username or email', users });
        const newUser = new User({ username, password, email});
        newUser.save((err, user) => {
          if (err) return handleErr(res, 500);
          sendEmail.welcome(user.email).then(result => res.json(user), err => handleErr(res, 500));
        });
      });
  },
  Authenticate: async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return handleErr(res, 422,'Please fill in all fields');
    User.findOne({ username })
      .exec()
      .then(user => {
        const validated = await validPass(password, user.password);
        if (!user) return handleErr(res, 404, 'There is no account for this username.');
        //if (!validPass(password, user.password)) return handleErr(res, 401, 'Incorrect credentials. Please try again.');
        if (!validated) return handleErr(res, 401, 'Incorrect credentials. Please try again.');
        const payload = {
          iss: 'Parol_lakay',
          sub: user._id,
          exp: moment().add(10, 'days').unix()
        }
        const token = jwt.sign(payload, process.env.SECRET);
        res.status(200).send({ token, user });
      }, err => handleErr(res, 500));
  },
  forgotPass: (req, res) => {
    const { email } = req.body;
    const getToken = done => {
      crypto.randomBytes(20, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    };
    const addToUser = (token, done) => {
      User.findOne({ email }, (err, user) => {
        if (err) {
          done('Server error retrieving user account details.');
        } else {
          if (!user) {
            done('There is no user for that email address.');
          } else {
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000;
            user.save(saveErr => done(saveErr, user, token));
          }
        }
      });
    };
    const emailUser = (user, token, done) => {
      sendEmail.forgotPassword(user.email, token)
        .then(result => done(null, result, user, token), err => done(err));
    };
    async.waterfall([getToken, addToUser, emailUser], (err, result, user, token) => {
      if (err) return typeof err === 'string' ? handleErr(res, 501, err) : handleErr(res, 500);
      res.status(200).send({ email: user.email });
    });
  },
  resetPass: (req, res) => {
    const { token, password } = req.body;
    User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now()}})
      .exec()
      .then(user => {
        if (!user) return handleErr(res, 403, 'Password reset token is invalid or has expired');
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save((err, newUser) => {
          if (err) return handleErr(res, 500);
          sendEmail.pwResetSuccess(newUser.email).then(emailresult => res.json(user), err => handleErr(res, 500));
        });
      }, err => handle(res, 500));
  },
  // End Auth Controllers
  addVote: (req, res) => {
    User.findByIdAndUpdate(req.params.id,
      { $push: { 'upvotes': req.params.termId }},
      { safe:true, upsert:true, new:true },
      (err, user) => {
        if (err) return handleErr(res, 500);
        Term.findByIdAndUpdate(req.params.termId,
          { $inc: { 'upvotes': 1}},
          { safe:true, upsert:true, new:true },
          (err, term) => {
            if (err) return handleErr(res, 500);
            res.json({ user, term });
          })
      })
  },
  minusVote: (req, res) => {
    User.findByIdAndUpdate(req.params.id,
      { $pull: { 'upvotes': req.params.termId }},
      { safe:true, upsert:true, new:true },
      (err, user) => {
        if (err) return handleErr(res, 500);
        Term.findByIdAndUpdate(req.params.termId,
          { $inc: { 'upvotes': -1}},
          { safe:true, upsert:true, new:true },
          (err, term) => {
            if (err) return handleErr(res, 500);
            res.json({ user, term });
          });
      });
  },
  all: (req, res) => {
    User.find().exec((err, users) => err ? handleErr(res, 500) : res.json(users));
  }
}