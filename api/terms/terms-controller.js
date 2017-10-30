const Term = require('./terms-model');
const User = require('../users/user-model');
const { handleErr, sendEmail, getAchievements } = require('../utils');
const async = require('async');


const getPopulatedTerm = (id, res) => {
  Term.findById(id).populate('author sentences.author').exec().then(term => {
    return term ? term : handleErr(res, 500);
  }, err => handleErr(res, 500))
}

const populateOptions = [
  { path: 'terms'},
  { path: 'upvotes'},
  { path: 'savedTerms.term'}
];

const titleCase = (str) => str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

module.exports = function () {
  return {
    newDefinition: (req, res) => {
      console.log(req.headers);
      const text = req.body.text.toLowerCase();
      const { definition, sentences, author, tags, phonetic } = req.body;
      
      if (!text || !definition) return handleErr(res, 422, 'You must have at least a [Word] and a [Definition]. Fill those out. - Jorge');
      const newDef = new Term({ text, definition, sentences, author, tags, phonetic });
      const achievements = require('../utils/achievements');

      const saveNewTerm = done => {
        newDef.save((err, word) => {
          if (err) return done('Could not save this word.');
          done(null, word);
        });
      }

      const processUser = (word, done) => {
        User.findById(author).exec().then(person => {
          person.terms.push(word._id);
          const numTerms = person.terms.length;
          const achievementLength = person.achievements.length;
          if (numTerms <= 1804 && person.nextAchievementMin <= numTerms) {
            
            const newAchievement = achievements.get(person.nextAchievementMin);
            const notification = {
              text: `You just unlocked a new Achievement: ${newAchievement.name}`,
              url: `/myAcount`
            }
            person.achievements.push(newAchievement);
            person.nextAchievementMin = achievements.next(newAchievement.min);
            person.toNextAchievement = achievements.next(newAchievement.min) - numTerms;
            person.notifications.push(notification);
          }          
          person.save((err, user) => {
            if (err) return done('Word has been saved, but we ran into a server error giving you credit.');
            User.populate(user, populateOptions, (traka, moun) => {
              if (traka) return done('Please restart your browser');
              sendEmail.newDefinition(user.email, text).then(success => {
                if (user.achievements.length > achievementLength) { 
                  const data = {
                    name: user.achievements[user.achievements.length - 1].name,
                    amtLeft: user.toNextAchievement
                  }
                  if (!user.notificationSettings.achievements) return done(null,moun, word);
                  sendEmail.achievement(user.email, data).then(result => done(null,moun, word), error => done('Word has been saved, Also you got a new achievement, but we couldnt email you about it.'))
                } else {
                  done(null,moun, word);
                }
              }, e => done('Word has been saved, but we ran into a server error emailing you about it.'));
            })
            
          });
        }, e => done('Word has been saved, but we ran into a server error giving you credit.'));
      }

      const getPopulated = (user, word, done) => {
        Term.findById(word._id).populate('author sentences.author').exec().then(defined => done(null, defined, user), error => done('Word added, but you will need to refresh your browser.'));
      }

      async.waterfall([ saveNewTerm, processUser, getPopulated ], (err, defined, user) => {
        if (err) return handleErr(res, 400, err, err);
        res.json({ defined, user })
      });
    },
    termSearch: (req, res) => {
      const { term, letter } = req.query;
      console.log(req.query);
      const query = term || new RegExp('^' + letter,'i');
      if (!term && !letter) return handleErr(res, 403, 'Incorrect search query. You did something wrong men, come on.');
      Term.find({ text: query }).populate('author sentences.author').sort({ upvotes: -1 }).exec()
        .then(terms => terms.length > 0 ? res.json(terms) : handleErr(res, 404, 'Looks like this word is not in our database. Maybe you should add it.'), err => handleErr(res, 500));
    },
    allTerms: (req, res) => {
      Term.find().populate('author sentences.author').sort({ "_id" : -1}).exec()
        .then(terms => terms.length > 0 ? res.json(terms) : handleErr(res, 404, 'There are no terms found on the database'), err => handleErr(res, 500));
    },
    tagSearch: (req, res) => {
      const { tag } = req.query;
      console.log(tag);
      if (!tag) return handleErr(res, 400, `Bad request, please try again. Ou pa kon sa'w ap fe?`);
      Term.find({ tags: tag}).populate('author sentences.author').sort({ upvotes: -1 }).exec()
        .then(terms => terms.length > 0 ? res.json(terms) : handleErr(res, 404, `There are no terms with this tag.`), err => handleErr(res, 500));
    },
    addSentence: (req, res) => {
      const { text, author } = req.body
      if (!Term.findById(req.params.id)) return handleErr(res, 500);
      const AddToterm = done => {
        Term.findByIdAndUpdate(req.params.id,
          { $push: { sentences: { text, author} }},
          { new:true, safe:true, upsert:true },
          (err, term) => {
            if (err) return done({ message: 'Server error Adding this sentecece please try again.', data: err });
            Term.findById(term._id).populate('author sentences.author').exec((newErr, theTerm) => {
              if (newErr) return done({ message: 'Sentence added, please restart your browser.', data: newErr });
              done(null, theTerm);
            });
          });
      }
      const NotifyAuthor = (term, done) => {
        if (author == term.author._id) return done(null, term.author, term);
        User.findById(term.author._id).exec().then(creator => {
          const notification = {
            text: `${creator.username} used your term '${titleCase(term.text)}' in a sentence.`,
            url: `/search?term=${term.text}`
          }
          creator.notifications.push(notification);
          creator.save((err, moun) => {
            if (err) return done({ message: 'Sentence Added, but you may need to restart your browser.', data: err });
            term.text = titleCase(term.text);
            const data = {
              term,
              user: moun,
            }
            if (!moun.notificationSettings.sentences) return done(null, moun, term);
            sendEmail.sentenceAdded(moun.email, data).then(() => done(null, moun, term), problem => done({ message: 'Sentence added, but you may need to restart your browser.', data: problem }));
          });
        }, e => done({ message: 'Sentence added, you may have to restart your browser.', data: e }));
      }

      async.waterfall([
        AddToterm,
        NotifyAuthor
      ], (err, moun, term) => {
        if (err) return handleErr(res, 503, err.message, err.data);
        res.json(term);
      })


    },
    addIncidence: (req, res) => {
      const { user } = req.body;
      Term.findById(req.params.id).populate('author sentences.author').exec().then(term => {
        console.log(term.incidences);
        if (!term) return handleErr(res, 404, 'Error retrieving term to report');
        if (term.incidences.includes(user)) return handleErr(res, 400, 'You have already reported this term.');
        term.incidences.push(user);
        term.save((err, newTerm) => {
          if (err) return handleErr(res, 500);
          newTerm.author = term.author;
          newTerm.sentences = term.sentences;
          res.json(newTerm);
        })
      }, err => handleErr(res, 500));
    },
    removeSentence: (req, res) => {
      Term.findByIdAndUpdate(req.params.id,
        { $pull: { 'sentences': { '_id': req.params.sentenceId }}},
        { safe:true, new:true },
        (err, term) => {
          if (err) return handleErr(res, 500);
        
          res.json(term);
        });
    }
  }
}