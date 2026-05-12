const express = require("express");
const cors = require("cors");
const config = require("./config.json");
const cookieParser = require('cookie-parser');
const multer = require("multer");
const app = express();

// 1. 기본 설정
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// 2. Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// 3. 보안 및 전처리 필터

// 통합 요청 처리
const handleDynamicTask = (req, res, method) => {
    const qObj = { method: method === 'delete' ? 'del' : method };
    
    setQObj(req, res, qObj); 
};

// 4. 메소드별 통로
const API_PATH = "/api/*";

// GET 통로
app.get(API_PATH, async (req, res) => {
    handleDynamicTask(req, res, "get");
});

// POST 통로 (파일 업로드 포함)
app.post(API_PATH, upload.any(), (req, res) => {
    handleDynamicTask(req, res, "post");
});

// PUT 통로 (파일 업로드 포함)
app.put(API_PATH, upload.any(), (req, res) => {
    handleDynamicTask(req, res, "put");
});

// DELETE 통로
app.delete(API_PATH, upload.any(), (req, res) => {
    handleDynamicTask(req, res, "delete");
});

// PATCH 통로
app.patch(API_PATH, (req, res) => {
    handleDynamicTask(req, res, "patch");
});

// 인증 기능
const authRouter = require("./task/login/auth");
app.use("/auth", authRouter);

// URL 분석 -> 파일 매핑 -> 서비스 실행
const setQObj = async () => {

}

// 서버 실행
app.listen(config.PORT, () => {
    console.log(`Server Rebuilt: http://localhost:${config.PORT}`);
});