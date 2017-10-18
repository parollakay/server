const mongoose = require('mongoose'),
      Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const userSchema = new Schema({
  newsletter: {
    type: Boolean,
    default: false
  },
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

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.methods.generateHash = password => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};


module.exports = mongoose.model('User', userSchema);