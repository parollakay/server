const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderboardSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  terms: {
    type: Number,
    default: 1
  }
})

module.exports = mongoose.model('Leader', leaderboardSchema);