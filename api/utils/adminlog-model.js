const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logItemSchema = new Schema({
  created: {
    type: Date,
    default: new Date()
  },
  event: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Log', logItemSchema);