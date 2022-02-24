const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  sample: {
    type: String,
    required: true,
  },
  src: {
    type: String,
    required: true,
  },
  srcURL: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Tasks', TaskSchema);
