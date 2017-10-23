const async = require('async');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');

const User = require('./user-model');
const Term = require('../terms/terms-model');
const { handleErr, sendEmail } = require('../utils');
const { MEMBER, WEEKLYWORD, addToList } = require('../utils/mailchimp');

module.exports = {
  // Auth Stuff
  register: (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return handleErr(res, 422, 'Please fill in all fields.');
    User.find({ $or: [{ email }, { username }]}, (err, users) => {
        if (err) return handleErr(res, 500, 'error from finding', err);
        if (users.length > 0) return res.status(409).send({ message: 'A user already exists with either this username or email', users });
        const newUser = new User();
        newUser.username = username.toLowerCase();
        newUser.password = newUser.generateHash(password);
        newUser.email = email.toLowerCase();
        newUser.save((err, user) => {
          if (err) return handleErr(res, 500, 'error in saving', err);
          const payload = {
            iss: 'Parol_lakay',
            sub: user._id,
            exp: moment().add(10, 'days').unix()
          }
          const token = jwt.sign(payload, process.env.SECRET);
          sendEmail.welcome(user.email)
            .then(result => addToList(user.email, MEMBER)
              .then(() => res.status(200).send({ token, user }), e => {
                if (e.status === 400) return res.status(200).send({ token, user});
                return handleErr(res, e.status, e.detail, e);
              }), err => handleErr(res, 500, 'error from emailing', err));    
        });
      });
  },
  Authenticate: (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return handleErr(res, 422,'Please fill in all fields');
    User.findOne({ username })
      .exec()
      .then(user => {
        if (!user) return handleErr(res, 404, 'There is no account for this username.');
        if (!user.validPassword(password)) return handleErr(res, 403, 'Incorrect credentials. Please try again.');
        const payload = {
          iss: 'Parol_lakay',
          sub: user._id,
          exp: moment().add(10, 'days').unix()
        }
        const token = jwt.sign(payload, process.env.SECRET);
        res.status(200).send({ token, user });
      }, err => handleErr(res, 500));
  },
  autoAuth: (req, res) => {
    User.findById(req.params.id).exec()
      .then(user => user ? res.json(user) : handleErr(res, 404, 'User information could not be found.'), err => handleErr(res, 500));
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
        user.password = user.generateHash(password);
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
            Term.findById(term.id).populate('author sentences.author').exec((newErr, theTerm) => {
              if (newErr) return handleErr(res, 500, 'Please restart your browser');
              res.json({ user, term: theTerm });
            });
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
            Term.findById(term.id).populate('author sentences.author').exec((newErr, theTerm) => {
              if (newErr) return handleErr(res, 500, 'Please restart your browser');
              res.json({ user, term: theTerm });
            });
          });
      });
  },
  all: (req, res) => {
    User.find().exec((err, users) => err ? handleErr(res, 500) : res.json(users));
  },
  subscibeToWeeklyList: (req, res) => {
    const { email } = req.body;
    console.log(req.body);
    User.findOne({ email }).exec().then(user => {
      console.log(user);
      addToList(email, WEEKLYWORD).then(() => {
        if (user) {
          user.newsletter = true;
          user.save((err, data) => {
            if (err) return handleErr(res, 500, 'User added to list, but error trying to save user as subscribed in database.', err);
            res.json(data);
          })
        } else {
          res.status(200).send({ message: 'Subscribed successfuly!'});
        }        
      }, e => {
        if (e.status !== 400) return handleErr(res, e.status, e.detail , e);
        res.status(400).send({ message: `You're already subscribed.`}); 
      });
    }, err => handleErr(res, 500));
  },
  changePassword: (req, res) => {
    const { current, password } = req.body;
    User.findById(req.params.id).exec().then(user => {
      if (!user.validPassword(current)) return handleErr(res, 401, 'Incorrect password. Try again.');
      user.password = user.generateHash(password);
      user.save((err, data) => {
        if (err) return handleErr(res, 500);
        res.json(data);
      });
    }, e => handleErr(res, 500));
  }
}