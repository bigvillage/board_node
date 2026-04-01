const express = require("express");
const router = express.Router();
const connectDB = require("./db"); // DB 연결 함수
const User = require("./models/user"); // MongoDB 모델

// 1. auth.js가 로드될 때 바로 DB 연결 실행
connectDB();

/**
 * [회원가입 로직 함수]
 * @param {Object} userData - Vue에서 전달된 이름, 이메일, 비번
 * @returns {Object} - 처리 결과 (성공 여부 및 메시지)
 */
const join = async (userData) => {
    try {
        const { name, email, password } = userData;

        // MongoDB에 저장할 객체 생성
        const newUser = new User({
            name,
            email,
            password, // 보안을 위해 나중에 bcrypt 등으로 암호화하는 것을 추천합니다!
        });

        // 실제 디비 호출 및 저장
        await newUser.save();

        // 저장 성공 시 리턴
        return { success: true, message: "회원가입이 완료되었습니다!" };
    } catch (error) {
        console.error("MongoDB 저장 에러:", error);

        // 이메일 중복 에러 처리 (MongoDB unique 제약조건)
        if (error.code === 11000) {
            return { success: false, message: "이미 사용 중인 이메일입니다." };
        }
        return { success: false, message: "서버 내부 오류가 발생했습니다." };
    }
};

/**
 * [라우터 설정]
 * app.was.js에서 /auth로 들어온 요청을 여기서 처리
 */
router.post("/signup", async (req, res) => {
    // 1. join 함수를 실행하고 결과를 기다림 (await)
    const result = await join(req.body);

    // 2. 함수가 리턴한 결과(success, message 등)를 그대로 Vue(axios)로 전송
    // 이 res.json()이 호출되어야 Vue의 response.data에 값이 들어갑니다.
    res.json(result);
});

module.exports = router;