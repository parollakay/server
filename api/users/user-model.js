const mongoose = require('mongoose'),
      Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const badgeSchema =  new Schema({
  created: {
    type: Date,
    default: Date.now()
  },
  name: String,
  description: String,
  min: Number
})

const notificationSchema = new Schema({
  created: {
    type: Date,
    default: new Date
  },
  text: String,
  url: String,
  read: {
    type: Boolean,
    default: false
  }
})

const savedTermSchema = new Schema({
  created: {
    type: Date,
    default: new Date
  },
  term: {
    type: Schema.Types.ObjectId,
    ref: 'Term'
  },
  note: String
});

const userSchema = new Schema({
  created: {
    type: Date,
    default: Date.now()
  },
  savedTerms: [savedTermSchema],
  newsletter: {
    type: Boolean,
    default: false
  },
  achievements: [badgeSchema],
  toNextAchievement: {
    type: Number,
    default: 1
  },
  nextAchievementMin: {
    type: Number,
    default: 1
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
  notifications: [notificationSchema],
  notificationSettings: {
    likes: {
      type: Boolean,
      default: true
    },
    sentences: {
      type: Boolean,
      default: true
    },
    achievements: {
      type: Boolean,
      default: true
    }
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

// Remove notifications that have been read.
userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('notifications')) return next();
  const NewNotifications = user.notifications.filter((notification) => {
    return !notification.read;
  });
  user.notifications = NewNotifications;
  next();
});

module.exports = mongoose.model('User', userSchema);