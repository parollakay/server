const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const termSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  definition: {
    type: String,
    required: true
  },
  sentence: String,
  created: {
    Type: Date,
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
  },
  downVotes: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Term', termSchema);