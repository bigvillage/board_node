const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const mongoose = require('mongoose');
const connectDB = require("../../db");
const Upload = require("./models/upload");
require('dotenv').config();

connectDB();

// 1. R2 설정
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// 2. Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// 3. DB 모델 정의 (기존 유지 + 확장)
// const uploadSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   content: String,

//   tags: {
//     type: [String],
//     default: []
//   },

//   files: [
//     {
//       fileKey: String,
//       originalName: String,
//       size: Number,
//       fileUrl: String
//     }
//   ],

//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // 모델 중복 생성 방지
// const Upload = mongoose.model('Upload', uploadSchema`);

module.exports = {
  uploadMiddleware: upload.array('files'),
  

  processUpload: async (req, res) => {
    delete req.body.files;
    try {
      console.log('🔥 업로드 시작');

      const { title, content, tags } = req.body;
      const files = req.files;

      // 필수값 체크
      if (!title) {
        return res.status(400).json({ message: '제목은 필수입니다.' });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ message: '파일이 필요합니다.' });
      }

      const uploadedFilesInfo = [];

      // 파일 업로드 루프
      for (const file of files) {
        const utf8Name = Buffer.from(file.originalname, 'latin1').toString('utf8');

        const fileKey = `${Date.now()}_${utf8Name}`;

        // ✅ R2 업로드
        await s3.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }));

        // ✅ 파일 URL 생성 (다운로드용)
        const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

        uploadedFilesInfo.push({
          fileKey,
          originalName: utf8Name,
          size: file.size,
          type: file.mimetype,
          fileUrl
        });

        console.log('✅ 업로드 완료:', utf8Name);
      }

      // MongoDB 저장
      const newUpload = new Upload({
        title,
        content,
        tags: tags ? JSON.parse(tags) : [],
        files: uploadedFilesInfo,

        // 로그인 붙이면 사용
        userId: req.user?.id
      });

      console.log('💾 DB 저장 시도');

      await newUpload.save();

      console.log('🎉 DB 저장 완료');

      res.status(200).json({
        message: '업로드 + DB 저장 완료',
        data: newUpload
      });

    } catch (error) {
      console.error('❌ 에러:', error);
      res.status(500).json({ message: '서버 오류 발생' });
    }
  }
};