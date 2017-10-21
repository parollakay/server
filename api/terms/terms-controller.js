const Term = require('./terms-model');
const User = require('../users/user-model');
const { handleErr, sendEmail, getAchievements } = require('../utils');


const getPopulatedTerm = (id, res) => {
  Term.findById(id).populate('author sentences.author').exec().then(term => {
    return term ? term : handleErr(res, 500);
  }, err => handleErr(res, 500))
}



module.exports = function () {
  return {
    newDefinition: (req, res) => {
      const text = req.body.text.toLowerCase();
      const { definition, sentences, author, tags, phonetic } = req.body;
      if (!text || !definition) return handleErr(res, 422, 'You must have at least a [Word] and a [Definition]. Fill those out. - Jorge');
      const newDef = new Term({ text, definition, sentences, author, tags, phonetic });
      newDef.save((err, definition) => {
        if (err) return handleErr(res, 500);
        User.findById(author).exec().then(person => {
          person.terms.push(definition._id);
          const user = getAchievements(person);
          user.save((thisErr, newUser) => {
            if (thisErr) return handleErr(res, 500);
            if (newUser.achievements.length > person.achievements.length) { 
              const data = {
                name: newUser.achievements[newUser.achievements.length - 1].name,
                amtLeft: newUser.toNextAchievement
              }
              sendEmail.achievement(newUser.email, data);
            }
            Term.findById(definition._id).populate('author sentences.author').exec((newErr, newDef) => {
              if (newErr) return handleErr(res, 500);
              sendEmail.newDefinition(newUser.email, text).then(result => res.json(newDef), err => handleErr(res, 500, 'error sending email', err));
            });
          })
        }, e => handleErr(res, 500));
      });
    },
    termSearch: (req, res) => {
      const { term, letter } = req.query;
      console.log(req.query);
      const query = term || new RegExp('^' + letter,'i');
      if (!term && !letter) return handleErr(res, 403, 'Incorrect search query. You did something wrong men, come on.');
      Term.find({ text: query }).populate('author sentences.author').sort({ upvotes: -1 }).exec()
        .then(terms => terms ? res.json(terms) : handleErr(res, 404, 'Looks like this word is not in our database. Maybe you should add it.'), err => handleErr(res, 500));
    },
    allTerms: (req, res) => {
      Term.find().populate('author sentences.author').sort({ created: -1 }).exec()
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
      Term.findByIdAndUpdate(req.params.id,
        { $push: { sentences: { text, author} }},
        { new:true, safe:true, upsert:true },
        (err, term) => {
          if (err) return handleErr(res, 500);
          Term.findById(term._id).populate('author sentences.author').exec((newErr, theTerm) => {
            if (newErr) return handleErr(res, 500, 'Please refresh your browser.');
            res.json(theTerm);
          });
        });
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