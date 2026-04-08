const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const mongoose = require('mongoose'); // MongoDB 저장을 위해 필요
require('dotenv').config();

// 1. R2 설정
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// 2. Multer 메모리 설정
const upload = multer({ storage: multer.memoryStorage() });

// 3. (중요) DB에 저장할 게시글 모델 정의
// 이미 다른 곳에 모델이 있다면 require로 불러오셔도 됩니다.
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
  files: [{
    fileKey: String,
    originalName: String
  }],
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

module.exports = {
  uploadMiddleware: upload.array('files'), // 프론트엔드 input name="files"와 맞춤

  processUpload: async (req, res) => {
    try {
      const { title, content, tags } = req.body;
      const files = req.files;
      const uploadedFilesInfo = [];

      // R2 업로드 루프
      if (files && files.length > 0) {
        for (const file of files) {
          const fileKey = `${Date.now()}_${file.originalname}`;
          
          await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          }));

          uploadedFilesInfo.push({
            fileKey: fileKey,
            originalName: file.originalname
          });
        }
      }

      // 4. 몽고DB 저장
      const newPost = new Post({
        title,
        content,
        tags: tags ? JSON.parse(tags) : [], // 문자열로 올 경우 대비
        files: uploadedFilesInfo
      });

      await newPost.save();

      res.status(200).json({ 
        message: 'R2 업로드 및 DB 저장 성공!',
        data: newPost 
      });

    } catch (error) {
      console.error('처리 중 에러:', error);
      res.status(500).json({ message: '서버 오류 발생' });
    }
  }
};