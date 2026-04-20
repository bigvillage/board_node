const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const mongoose = require('mongoose');
const connectDB = require("../../db");
const Upload = require("./models/upload");
const axios = require('axios')
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

        // 1. R2 업로드
        await s3.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }));

        // 파일 URL 생성 (다운로드용)
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

      // 2. MongoDB 저장
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

      // 3. ES 저장
      try {

        await axios.post(
          `${process.env.ES_URL}/documents/_doc/${newUpload._id}`,
          {
            title: newUpload.title,
            content: newUpload.content,
            tags: newUpload.tags,
            createdAt: newUpload.createdAt,
            files: newUpload.files.map(f => ({
              originalName: f.originalName,
              fileUrl: f.fileUrl
            }))
          },
          {
            auth: {
              username: 'elastic',
              password: "123!@#qwe"
            }
          }
        )
        console.log('ES 저장 완료')
      } catch (error) {
        console.error('ES 저장 실패:', error.message)
        console.error(error.response?.data)
      }


      res.status(200).json({
        message: '업로드 + DB 저장 완료',
        data: newUpload
      });

    } catch (error) {
      console.error('에러:', error);
      res.status(500).json({ message: '서버 오류 발생' });
    }
  },
  updateDocument: async (req, res) => {
    try {
      const { id } = req.params
      const { title, content, tags } = req.body
      const files = req.files

      const removedFiles = req.body.removedFiles
        ? JSON.parse(req.body.removedFiles)
        : []

      const doc = await Upload.findById(id)
      if (!doc) {
        return res.status(404).json({ message: '문서 없음' })
      }

      // 1. 삭제된 파일 제거
      for (const file of removedFiles) {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: file.fileKey
        }))
      }

      // Mongo에서도 제거
      let updatedFiles = doc.files.filter(f =>
        !removedFiles.some(r => r.fileKey === f.fileKey)
      )

      // 2. 새 파일 추가
      if (files && files.length > 0) {
        for (const file of files) {
          const utf8Name = Buffer.from(file.originalname, 'latin1').toString('utf8')
          const fileKey = `${Date.now()}_${utf8Name}`

          await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          }))

          const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`

          updatedFiles.push({
            fileKey,
            originalName: utf8Name,
            size: file.size,
            type: file.mimetype,
            fileUrl
          })
        }
      }

      doc.title = title
      doc.content = content
      doc.tags = tags ? JSON.parse(tags) : []
      doc.files = updatedFiles

      doc.updatedAt = new Date()
      doc.isUpdated = true

      await doc.save()

      // ES 수정
      try {
        await axios.put(
          `${process.env.ES_URL}/documents/_doc/${doc._id}`,
          {
            title: doc.title,
            content: doc.content,
            tags: doc.tags,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            files: doc.files.map(f => ({
              originalName: f.originalName,
              fileUrl: f.fileUrl
            }))
          },
          {
            auth: {
              username: 'elastic',
              password: process.env.ES_PASSWORD
            }
          }
        )
        console.log("ES 저장 완료")
      } catch (error) {
        console.error('ES 저장 실패:', error.message)
        console.error(error.response?.data)

      }

      res.json({
        message: '수정 완료',
        data: doc
      })

    } catch (error) {
      console.error(error)
      res.status(500).json({ message: '서버 오류' })
    }
  },

  deleteDocument: async (req, res) => {
    try {
      const { id } = req.params

      const doc = await Upload.findById(id)
      if (!doc) {
        return res.status(404).json({ message: '문서 없음' })
      }

      // 1. R2 파일 전부 삭제
      for (const file of doc.files) {
        if (!file.fileKey) continue

        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: file.fileKey
        }))

        console.log('🗑 파일 삭제:', file.fileKey)
      }

      // 2. Mongo 삭제
      await Upload.findByIdAndDelete(id)

      // 3. ES 삭제
      try {
        await axios.delete(
          `${process.env.ES_URL}/documents/_doc/${id}`,
          {
            auth: {
              username: 'elastic',
              password: process.env.ES_PASSWORD
            }
          }
        )
        console.log('ES 저장 완료')
      } catch (error) {
        console.error('ES 저장 실패')
      }

      res.json({ message: '삭제 완료' })

    } catch (error) {
      console.error(error)
      res.status(500).json({ message: '서버 오류' })
    }
  }
};