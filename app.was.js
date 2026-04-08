const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./config.json")
const https = require("https");
const multer = require("multer");
const cors = require("cors");
const uploadHandler = require("./upload/upload");

const app = express();

// 1. JSON 데이터 해석을 위한 기본 설정
app.use(cors());
app.use(express.json());

// 2. [전역 핸들러] 모든 요청은 여기서 먼저 걸러집니다.
app.use((req, res, next) => {
    console.log(`--- [신규 요청 발생] ---`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Body 데이터:`, req.body); // 여기서 값을 확인!
    
    // 예: 특정 값이 없으면 다음 단계로 안 보내고 여기서 커트할 수도 있음
    // if (!req.body.someKey) return res.status(400).send("필수 데이터 누락");

    console.log(`------------------------`);
    
    next(); // ⬅️ 이게 제일 중요합니다! 다음 순서(라우터)로 넘겨주는 역할입니다.
});

// 3. 검증이 끝난 후 실제 작업을 할 파일들로 분기
const authRouter = require("./task/login/auth");
const uploadHandler = require("./task/upload/upload");
// const postRouter = require("./task/post/board"); // 예시

app.use("/auth", authRouter);
// app.use("/post", postRouter);
app.post("/upload", uploadHandler.uploadMiddleware, uploadHandler.processUpload);

app.listen(config.PORT, () => {
    console.log(`Server started: http://localhost:${config.PORT}`);
});




