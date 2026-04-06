const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');

// MongoDB 연결 설정
const mongoURI = "mongodb://localhost:27017/mydatabase";
const conn = mongoose.createConnection(mongoURI);

// GridFS 스토리지 엔진 설정
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: `${Date.now()}_${file.originalname}`, // 저장될 파일 이름
      bucketName: 'uploads' // 컬렉션 이름 (uploads.files, uploads.chunks 생성됨)
    };
  }
});

const upload = multer({ storage });

module.exports = {
  // app.was.js에서 사용할 미들웨어와 처리 로직
  uploadMiddleware: upload.array('files'), 
  
  processUpload: (req, res) => {
    // 파일은 이미 스토리지 엔진에 의해 MongoDB에 저장된 상태입니다.
    const { title, content, tags } = req.body;
    
    // 여기서 파일 ID를 일반 문서 DB에 기록하거나 추가 로직 처리
    res.status(200).json({ 
      message: 'MongoDB GridFS에 파일 저장 완료',
      files: req.files 
    });
  }
};