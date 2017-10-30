const async = require('async');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');

const User = require('./user-model');
const Term = require('../terms/terms-model');
const { handleErr, sendEmail } = require('../utils');
const { MEMBER, WEEKLYWORD, addToList } = require('../utils/mailchimp');

const populateOptions = [
  { path: 'terms'},
  { path: 'upvotes'},
  { path: 'savedTerms.term'}
];

const titleCase = (str) => str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

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
          User.populate(user, populateOptions, (error, moun) => {
            sendEmail.welcome(user.email)
            .then(result => addToList(user.email, MEMBER)
              .then(() => res.status(200).send({ token, user: moun }), e => {
                if (e.status === 400) return res.status(200).send({ token, user: moun });
                return handleErr(res, e.status, e.detail, e);
              }), err => handleErr(res, 500, 'error from emailing', err));  
          })
        });
      });
  },
  Authenticate: (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return handleErr(res, 422,'Please fill in all fields');
    User.findOne({ username: username.toLowerCase() })
      .populate('terms upvotes savedTerms.term')
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
    User.findById(req.params.id).populate('terms upvotes savedTerms.term').exec()
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
      .populate('terms upvotes savedTerms.term')
      .exec()
      .then(user => {
        if (!user) return handleErr(res, 403, 'Password reset token is invalid or has expired');
        user.password = user.generateHash(password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save((err, newUser) => {
          if (err) return handleErr(res, 500);
          User.populate(newUser, populateOptions, (error, person) => {
            if (error) return handleErr(res, 503, 'You may have to restart your browser.');
            sendEmail.pwResetSuccess(newUser.email).then(emailresult => res.json(person), err => handleErr(res, 500));
          });  
        });
      }, err => handle(res, 500));
  },
  // End Auth Controllers
  markNotificationRead: (req, res) => {
    User.findOneAndUpdate(
      { _id: req.params.id, 'notifications._id': req.params.notification },
      { $set: { 'notifications.$.read': true }},
      { new: true, safe: true, upsert: true },
      (err, result) => {
        if (err) return handleErr(res, 500);
        User.populate(result, populateOptions, (error, user) => {
          if (error) return handleErr(res, 503, 'Please restart your browser.');
          res.json(user);
        })
      }
    );
  },
  deleteNotification: (req, res) => {
    User.findByIdAndUpdate(req.params.id,
      { $pull: { 'notifications': { '_id': req.params.notification }}},
      { new: true, safe: true},
      (err, user) => {
        if (err) return handleErr(res, 500);
        User.populate(user, populateOptions, (error, person) => {
          if (error) return handleErr(res, 503, 'Please restart your browser.');
          res.json(person);
        });
      });
  },
  clearAllNotifications: (req, res) => {
    User.findByIdAndUpdate(req.params.id, 
      { $set: { 'notifications': [] }}, 
      { new: true, upsert: true, safe: true}, 
      (err, response) => {
        console.log(err, response);
        if (err) return handleErr(res, 500);
        User.populate(response, populateOptions, (error, person) => {
          if (error) return handleErr(res, 503, 'Please restart your browser.');
          res.json(person);
        });
      })
  },
  populatedUser: (req, res) => {
    User.findById(req.params.id).populate('terms upvotes savedTerms.term').exec((err, user) => {
      if (err) return handleErr(res, 500);
      return user ? res.json(user) : handleErr(res, 404, 'Could not locate user information');
    });
  },
  addVote: (req, res) => {
    const addVoteToUser = done => {
      User.findByIdAndUpdate(req.params.id,
      { $push: { 'upvotes': req.params.termId }},
      { safe:true, upsert:true, new:true },
      (err, user) => {
        if (err) return done({ message: 'Error updating your account with this like.', data: err});
        User.populate(user, populateOptions, (error, person) => {
          if (error) return done({ message: 'Please restart your browser and try again', data: error });
          done(null, person);
        });
      })
    }
    const addVoteToTerm = (user, done) => {
      // return populated term
      Term.findByIdAndUpdate(req.params.termId,
        { $inc: { 'upvotes': 1}},
        { safe:true, upsert:true, new:true },
        (err, word) => {
          if (err) return done({ message: 'Could not add a Like to this term', data: err});
          Term.findById(word._id).populate('author sentences.author').exec((err2, term) => {
            if (err2) return done({ message: 'Term liked, but you may need to restart your browser.', data: err2 });
            done(null, term, user);
          })
        })
    }
    const addNotificationToAuthor = (term, user, done) => {
      // only if author is not also user
      console.log(term.author._id, req.params.id, user._id);
      if (term.author._id == req.params.id) {
        console.log('its the same');
        return done(null, user, term, user);
      };
      const notification = {
        text: `${user.username} liked your definition for: ${titleCase(term.text)}`,
        url: `/search?term=${term.text}`
      }
      
      User.findByIdAndUpdate(term.author._id,
        { $push: { 'notifications': notification }},
        { new: true, safe: true, upsert: true},
        (err, author) => {
          console.log(err, author);
          if (err) return done({ message: `Term liked successfully. But you may need to restart.`, data: err});
          const data = { term, user, };
          if (!author.notificationSettings.likes) return done(null, author, term, user);
          sendEmail.liked(author.email, data).then(() => done(null, author, term, user), error => done({ message: `Term liked, but you may need to restart your browser.`, data: error }));
        });
    }
    async.waterfall([
      addVoteToUser, 
      addVoteToTerm, 
      addNotificationToAuthor
    ], (err, author, term, user) => {
      if (err) return handleErr(res, 503, err.message, err.data);
      res.json({ user, term });
    })

  },
  minusVote: (req, res) => {
    const removeFromUser = done => {
      User.findByIdAndUpdate(req.params.id, 
        { $pull: { 'upvotes': req.params.termId }},
        { safe:true, upsert:true, new:true },
        (err, person) => {
          if (err) return done({ message: 'Could not perform operation, try again.', data: err});
          User.populate(person, populateOptions, (error, user) => {
            if (error) return done({ message: 'Please restart your browser.', data: error });
            done(null, user);
          })
        });
    }
    const removeFromTerm = (user, done) => {
      Term.findByIdAndUpdate(req.params.termId,
        { $inc: { 'upvotes': -1}},
        { safe:true, upsert:true, new:true },
        (err, word) => {
          if (err) return done({ message: 'Server error with this operation.', data: err });
          const opts = [
            { path: 'author'},
            { path: 'sentences', select: 'author' }
          ]
          Term.populate(word, opts, (error, term) => {
            if (error) return done({ message: 'Please restart your browser.', data: error });
            done(null, term, user);
          });
        });
    }

    async.waterfall([
      removeFromUser,
      removeFromTerm
    ], (err, term, user) => {
      if (err) return handleErr(res, 503, err.message, err.data);
      res.json({ user, term });
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
            User.populate(data, populateOptions, (error, person) => {
              if (error) return handleErr(res, 503, 'Please restart your browser.');
              res.json(person);
            });
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
      const notification = {
        text: 'Your password has been changed.',
        url: null
      }
      user.save((err, data) => {
        if (err) return handleErr(res, 500);
        User.populate(data, populateOptions, (error, person) => {
          if (error) return handleErr(res, 503, 'Please restart your browser.');
          res.json(person);
        });
      });
    }, e => handleErr(res, 500));
  },
  tgl_notification_for_likes: (req, res) => {
    User.findById(req.params.id).exec().then(user => {
      user.notificationSettings.likes = !user.notificationSettings.likes;
      user.save((err, result) => {
        if (err) return handleErr(res, 500);
        User.populate(result, populateOptions, (error, person) => {
          if (error) return handleErr(res, 503, 'Please restart your browser.');
          res.json(person);
        });
      })
    }, e => handleErr(res, 500));
  },
  tgl_notification_for_sentences: (req, res) => {
    User.findById(req.params.id).exec().then(user => {
      user.notificationSettings.sentences = !user.notificationSettings.sentences;
      user.save((err, result) => {
        if (err) return handleErr(res, 500);
        User.populate(result, populateOptions, (error, person) => {
          if (error) return handleErr(res, 503, 'Please restart your browser');
          res.json(person);
        });
      })
    }, e => handleErr(res, 500));
  },
  tgl_notification_for_achievements: (req, res) => {
    User.findById(req.params.id).exec().then(user => {
      user.notificationSettings.achievements = !user.notificationSettings.achievements;
      user.save((err, result) => {
        if (err) return handleErr(res, 500);
        User.populate(result, populateOptions, (error, person) => {
          if (error) return handleErr(res, 503, 'Please restart your browser');
          res.json(person);
        });
      })
    }, e => handleErr(res, 500));
  },
  notifications_off: (req, res) => {
    User.findByIdAndUpdate(req.params.id, 
      {$set: {
        'notificationSettings.achievements': false,
        'notificationSettings.likes': false,
        'notificationSettings.sentences': false
      }}, 
      { new: true, safe: true },
      (err, user) => {
        if (err) return handleErr(res, 500, 'Something went wrong setting all notifications off.', err);
        User.populate(user, populateOptions, (error, person) => {
          if (error) return handleErr(res, 503, 'Please restart your browser');
          res.json(person);
        });
      });
  },
  saveTerm: (req, res) => {
    const { term, note } = req.body;
    if (!term) return handleErr(res, 400, 'You may need to restart your browser before you can save this term.');    
    User.findById(req.params.id).exec().then(user => {
      for (let i = 0; i < user.savedTerms.length; i++) {
        if (user.savedTerms[i].term == term) return handleErr(res, 400, 'You already saved this term.');
      }
      user.savedTerms.push({ term, note });
      user.save((err, person) => {
        if (err) return handleErr(res, 500);
        User.populate(person, populateOptions, (error, moun) => {
          if (error) return handleErr(res, 503, 'Please restart your browser');
          res.json(moun);
        });
      });
    }, e => handleErr(res, 500));
  },
  unsaveTerm: (req, res) => {
    User.findByIdAndUpdate(req.params.id,
      { $pull: { 'savedTerms': { '_id': req.params.term } }},
      { safe: true },
      (err, user) => {
        if (err) return handleErr(res, 500);
        User.populate(user, populateOptions, (error, moun) => {
          if (error) return handleErr(res, 503, 'Please restart your browser');
          res.json(moun);
        });
      });
  },
  addNoteToSavedTerm: (req, res) => {},
  editSavedTermNote: (req, res) => {},
  deleteSavedTermNote: (req, res) => {}
}