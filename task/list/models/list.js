// task/login/models/User.js
const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: String,

  tags: {
    type: [String],
    default: []
  },

  files: [
    {
      fileKey: String,
      originalName: String,
      size: Number,
      fileUrl: String
    }
  ],

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 모델 중복 생성 방지
const Upload = mongoose.model('Upload', uploadSchema);