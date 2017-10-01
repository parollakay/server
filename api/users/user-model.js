const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  role: {
    type: String,
    enum: ['user', 'allowed', 'admin', 'super'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  terms: [{ type: Schema.Types.ObjectId, ref: 'Term'}],
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'Term'}],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'Term'}]
});

module.exports = mongoose.model('User', userSchema);