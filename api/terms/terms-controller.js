const Term = require('./terms-model');
const User = require('../users/user-model');
const { handleErr, sendEmail } = require('../utils');

module.exports = () => {
  return {
    newDefinition: (req, res) => {
      const text = req.body.text.toLowerCase();
      const { definition, sentences, author, tags, phonetic } = req.body;
      if (!text || !definition) return handleErr(res, 422, 'You must have at least a [Word] and a [Definition]. Fill those out. - Jorge');
      const newDef = new Term({ text, definition, sentences, author, tags, phonetic });
      newDef.save((err, definition) => {
        if (err) return handleErr(res, 500);
        User.findByIdAndUpdate(author,
          { $push: { 'terms': definition._id }},
          { new: true, upsert: true, safe: true },
          (err, user) => {
            if (err) return handleErr(res, 500);
            sendEmail.newDefinition(user.email, text).then(result => res.json(definition), err => handleErr(res, 500));
          });
      });
    },
    termSearch: (req, res) => {
      const { term } = req.query;
      Term.find({ text: req.query.term.toLowerCase() }).populate('author').exec()
        .then(terms => terms ? res.json(terms) : handleErr(res, 404, 'Looks like this word is not in our database. Maybe you should add it. - Jorge'), err => handleErr(res, 500));
    },
    allTerms: (req, res) => {
      Term.find().populate('author sentences.author').exec()
        .then(terms => terms ? res.json(terms) : handleErr(res, 404, 'There are no terms found on the database'), err => handleErr(res, 500));
    },
    addSentence: (req, res) => {
      const { text, author } = req.body
      Term.findByIdAndUpdate(req.params.id,
        { $push: { sentences: { text, author} }},
        { new:true, safe:true, upsert:true },
        (err, term) => {
          if (err) return handleErr(res, 500);
          res.json(term);
        });
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