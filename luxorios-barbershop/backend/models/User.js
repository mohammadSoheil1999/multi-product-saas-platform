const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isVIP: {
    type: Boolean,
    default: false, // By default, users are not VIP
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;