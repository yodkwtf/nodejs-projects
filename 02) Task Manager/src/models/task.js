const mongoose = require('mongoose');

// setup a model
const taskSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      trim: true,
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// creating a model with schema
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
