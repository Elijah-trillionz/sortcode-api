const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  ans: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  quest: {
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
  options: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Questions', QuestionSchema);
