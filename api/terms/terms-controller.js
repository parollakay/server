const Term = require('./terms-model');
const { handleErr, sendEmail } = require('../utils');

module.exports = () => {
  return {
    // new definition
    newDefinition: (req, res) => {
      const { text, definition, sentence, author, tags, phonetic } = req.body;
      if (!text || !definition) return handleErr(res, 422, 'You must have at least a [Word] and a [Definition]. Fill those out. - Jorge');
      if (!author) return handleErr(res, 422, 'You must be logged in to add to the dictionary.');
      const newDef = new Term({ text, definition, sentence, author, tags, phonetic });
      newDef.save((err, definition) => err ? handleErr(res, 500) : res.json(definition));
    },
    // Get by term
    termSearch: (req, res) => {
      const { term } = req.query;
      Term.find({ text: req.query.term })
        .populate('author')
        .exec()
        .then(terms => terms ? res.json(terms) : handleErr(res, 404, 'Looks like this word is not in our database. Maybe you should add it. - Jorge'))
        .catch(err => handleErr(res, 500));
    },
    
    // Terms
      // Returns all terms
    allTerms: (req, res) => {
      Term.find()
        .populate('author')
        .exec()
        .then(terms => terms ? res.json(terms) : handleErr(res, 404, 'There are no terms found on the database'))
        .catch(err => handleErr(res, 500));
    }
    // Add a sentence
    // Remove a sentence
    
  }
}