const express = require("express");
const router = express.Router();
const connectDB = require("../../db");
const User = require("./models/user");
const bcrypt = require("bcrypt"); // 1. bcrypt 라이브러리 불러오기

// DB 연결 실행
connectDB();

/**
 * [회원가입 로직 함수]
 */
const join = async (userData) => {
    try {
        const { name, email, password } = userData;

        // 2. 비밀번호 암호화 실행 (10은 암호화 강도인 saltRounds)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. 암호화 된 hashed암호 넣기
        const newUser = new User({
            name,
            email,
            password: hashedPassword, 
        });

        // 실제 디비 호출 및 저장
        await newUser.save();

        return { success: true, message: "회원가입이 완료되었습니다!" };
    } catch (error) {
        console.error("MongoDB 저장 에러:", error);

        if (error.code === 11000) {
            return { success: false, message: "이미 사용 중인 이메일입니다." };
        }
        return { success: false, message: "서버 내부 오류가 발생했습니다." };
    }
};

const login = async (userData) => {
    try {
        const { email, password } = userData;
        const user = await User.findOne({ email });

        if (!user) {
            return { success: false, message: "가입되지 않은 이메일입니다." };
        }

        // 여기서 bcrypt로 비교!
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            return { success: true, user: { name: user.name, email: user.email } };
        } else {
            return { success: false, message: "비밀번호가 일치하지 않습니다." };
        }
    } catch (error) {
        return { success: false, message: "서버 오류 발생" };
    }
};

const checkPassword = async (userData) => {
    try {
        const { email, password } = userData;

        const user = await User.findOne({ email });

        if (!user) {
            return { success: false, message: "유저 없음" };
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return { success: false, message: "비밀번호 틀림" };
        }

        return { success: true };

    } catch (error) {
        return { success: false, message: "서버 오류" };
    }
};

// 🔥 라우터 추가
router.post("/check-password", async (req, res) => {
    const result = await checkPassword(req.body);
    res.json(result);
});

// 라우터 등록
router.post("/login", async (req, res) => {
    const result = await login(req.body);
    res.json(result);
});

/**
 * [라우터 설정]
 */
router.post("/signup", async (req, res) => {
    const result = await join(req.body);
    res.json(result);
});

module.exports = router;