const express = require("express");
const cors = require("cors");
const config = require("./config.json");
const cookieParser = require('cookie-parser');
const multer = require("multer");
const app = express();
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

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
const setQObj = (req, res, qObj) => {
    try {
        // GET/DELETE용 query param 통합
        if (req.query && Object.keys(req.query).length > 0) {
            for (let key in req.query) {
                qObj[key] = req.query[key];
            }
        }

        // POST/PUT용 Body 데이터 통합
        if (req.body && Object.keys(req.body).length > 0) {
            for (let key in req.body) {
                qObj[key] = req.body[key];
            }
        }

        // 첨부파일 통합
        if (req.files) {
            qObj.files = req.files;
        }

        // 공통 정보 (URL, IP 등)
        qObj.url = req.url;
        qObj.ip = req.headers["x-forwarded-for"] || req.ip;

        // 로그인 체크로 이동
        checkLogin(req, res, qObj);
    } catch (error) {
        console.error("setQObj Error:", error);
        res.status(500).json({ success: false, message: "Data processing error" });
    }
};

// 로그인 체크
const checkLogin = async (req, res, qObj) => {
    const url = req.url.toLowerCase();
    const exceptionPath = ["/auth/login", "/auth/signup"]; // 로그인 안 해도 되는 길

    // 예외 경로 확인
    const isException = exceptionPath.some(path => url.includes(path));

    if (isException) {
        return callTask(req, res, qObj);
    }

    // JWT 또는 쿠키 기반 인증 체크
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    try {
        const decoded = jwt.verify(token, "my_secret_key");
        // 유저 정보를 qObj에 박아줌
        qObj.user = decoded; 
        callTask(req, res, qObj);
    } catch (err) {
        res.status(401).json({ success: false, message: "유효하지 않은 토큰입니다." });
    }
};

// 동적 파일 호출
const callTask = async (req, res, qObj) => {
    let reqUrl = req.url.split('?')[0]; // Query String 제거
    
    // URL 규칙 => /api/documents/list -> ./task/documents/list/index.js
    let directory = reqUrl.replace("/api/", ""); // "documents/list"
    const jsFilePath = path.join(__dirname, "task", directory, "index.js");

    try {
        // 파일 존재 여부 확인
        if (!fs.existsSync(jsFilePath)) {
            console.error(`File not found: ${jsFilePath}`);
            return res.status(404).json({ success: false, message: "잘못된 경로입니다." });
        }

        // 파일 로드
        const task = require(jsFilePath);

        // 메소드에 맞는 함수 실행 (get, post, put, del)
        const method = qObj.method;
        
        if (typeof task[method] === "function") {
            // task.get(req, res, qObj) 형식으로 호출
            await task[method](req, res, qObj);
        } else {
            res.status(405).json({ success: false, message: "지원하지 않는 메소드입니다." });
        }
    } catch (error) {
        console.error("Runtime Error:", error);
        res.status(500).json({ success: false, message: "서버 내부 오류 발생" });
    }
};

// 서버 실행
app.listen(config.PORT, () => {
    console.log(`Server Rebuilt: http://localhost:${config.PORT}`);
});