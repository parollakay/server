const mongoose = require('mongoose'),
      Schema = mongoose.Schema;
const { hash } = require('../utils');

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
  resetPasswordToken: String,
  resetPasswordExpires: {
    type: Date,
    default: Date.now()
  }
});
/*
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};*/

userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await hash(this.password);
    next();
  } catch(err) { next(err); }
});


module.exports = mongoose.model('User', userSchema);