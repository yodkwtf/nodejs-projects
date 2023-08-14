const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.length <= 6) {
          throw new Error('Password needs to be greater than 6 characters');
        }
        if (value.toLowerCase() === 'password') {
          throw new Error("Password can't be *password*");
        }
      },
    },

    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error('Age must be a positive number');
        }
      },
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Email is unvalid');
        }
      },
    },

    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],

    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
});

// !methods - methods for instances (specific user)
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// !statics - methods for models (all Users)
userSchema.statics.findByCredentials = async (email, password) => {
  // find the user
  const user = await User.findOne({ email });

  // if user doesnt exist
  if (!user) {
    throw new Error('Unable to login');
  }

  // if user is legit, compare the password
  const isMatch = await bcrypt.compare(password, user.password);

  // if password is incorrect
  if (!isMatch) {
    throw new Error('Unable to login');
  }

  // if password is correct
  return user;
};

// TODO - Hash the plain text pass before saving
userSchema.pre('save', async function (next) {
  // to avoid confusion
  const user = this;

  // hash the password if modiefied
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  // to end the function when we want
  next();
});

// TODO - Delete user tasks when user is deleted
userSchema.pre('remove', async function (next) {
  // to avoid confusion
  const user = this;

  // delete all tasks of a user
  await Task.deleteMany({ owner: user._id });

  // to end the function when we want
  next();
});

// setup a model
const User = mongoose.model('User', userSchema);

module.exports = User;
