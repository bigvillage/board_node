const express = require("express");
const cors = require("cors");
const config = require("./config.json");

const app = express();

// 1. 기본 설정
app.use(cors());
app.use(express.json());

// 2. 공통 로그 미들웨어
app.use((req, res, next) => {
  console.log(`--- [${req.method}] ${req.url} ---`);
  console.log("Body:", req.body);
  console.log("------------------------");
  next();
});

// 3. 라우터 import
const listRouter = require('./task/list/service');
const authRouter = require("./task/login/auth");
const uploadHandler = require("./task/upload/upload");

// 리스트 조회 (기존 유지)
app.use('/api', listRouter);

// 업로드 (기존 유지)
app.post(
  "/upload",
  uploadHandler.uploadMiddleware,
  uploadHandler.processUpload
);

// 수정 (기존 유지)
app.put(
  "/api/update/:id",
  uploadHandler.uploadMiddleware,
  uploadHandler.updateDocument
);

// 삭제 (기존 유지)
app.delete(
  "/api/upload/:id",
  uploadHandler.deleteDocument
);

// 문서 생성
app.post(
  "/api/documents",
  uploadHandler.uploadMiddleware,
  uploadHandler.processUpload
);

// 문서 수정 (⭐ multer 제거 - 중요)
app.put(
  "/api/documents/:id",
  uploadHandler.updateDocument
);

app.patch("/api/documents/:id/favorite", uploadHandler.toggleFavorite)

// 문서 삭제
app.delete(
  "/api/documents/:id",
  uploadHandler.deleteDocument
);

// 리스트 조회 (선택: listRouter 내부를 / 로 맞추면 사용 가능)
// app.use("/api/documents", listRouter);

// 인증
app.use("/auth", authRouter);

// 다운로드
app.get('/api/download', async (req, res) => {
  const { url, name } = req.query;

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(name)}"`
  );
  res.setHeader('Content-Type', 'application/octet-stream');

  res.send(Buffer.from(buffer));
});

// 서버 실행
app.listen(config.PORT, () => {
  console.log(`Server started: http://localhost:${config.PORT}`);
});