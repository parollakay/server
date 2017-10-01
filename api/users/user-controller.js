const User = require('./user-model');
const Term = require('../terms/terms-model');
const { handleErr, sendEmail } = require('../utils');
const async = require('async');

const addToVoteArr = (arr, el, userId) => {
  return new Promise((resove, reject) => {
    User.findByIdAndUpdate(userId, { $push: { arr: el }}, { new:true, safe:true }, (err, result) => {
        if (err) return reject(err);
        Term.findByIdAndUpdate(el, { $inc: {'upvotes': 1}}).exec((err, termResult) => err ? reject(err) : resolve(termResult));
      });
  });
}

const removeFromVoteArr = (arr, el, userId) => {
  return new Promise((resove, reject) => {
    User.findByIdAndUpdate(userId, { $pull: { arr: el }}, { new:true, safe:true }, (err, result) => {
      if (err) return reject(err);
      Term.findByIdAndUpdate(el, { $inc: {'upvotes': -1}}).exec((err, termResult) => err ? reject(err) : resolve(termResult));
    });
  });
}

module.exports = {
  upvoteTerm: (req, res) => {
    // Get user
    // find out if user has already upvoted or downvoted this term.
      // if upvoted, return;
      // if downvoted:
        // remove downvote
        // decrement number of downvotes in term
    // increment vote count in term
    // add term to user's upvotes
    // return user account.
    const getTerm = (done) => {

    };
    const getUser = (done) => {
      User.findById(req.params.id)
        .exec()
        .then(user => {
          if (user.upvotes.includes(req.params.termId)) return handleErr(res, 409, 'You have already upvoted this.');
          if (user.downvotes.includes(req.params.termId)) {
            user.downvotes.map((el, i) => el === req.params.termId ? user.downvotes.splice(i,0) : 'something');
            removeFromVoteArr(user.downvotes, req.params.termId, user._id)
              .then()
          }
          
        })
        .catch(err => handleErr(res, 500));
    }

    const makeMagic = (user, term, done) => {}

    async.waterfall([], (err) => {})
  },
  downvoteTerm: (req, res) => {}
}