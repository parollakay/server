const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const sentenceSchema = new Schema({
  text: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now()
  }
})

const termSchema = new Schema({
  live: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    required: true
  },
  definition: {
    type: String,
    required: true
  },
  sentences: [sentenceSchema],
  created: {
    type: Date,
    default: Date.now()
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{type: String}],
  phonetic: String,
  upvotes: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Term', termSchema);