const express = require("express");
const router = express.Router();
const connectDB = require("../../db");
const User = require("./models/user");
const bcrypt = require("bcrypt"); // 1. bcrypt 라이브러리 불러오기
const jwt = require("jsonwebtoken");
const SECRET = "my_secret_key";

// DB 연결 실행
connectDB();

const join = async (userData) => {
    try {
        const { name, email, password } = userData;

        // 비밀번호 암호화 실행 (10은 암호화 강도인 saltRounds)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 암호화 된 hashed암호 넣기
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

// const login = async (userData) => {
//     try {
//         const { email, password } = userData;
//         const user = await User.findOne({ email });

//         if (!user) {
//             return { success: false, message: "가입되지 않은 이메일입니다." };
//         }

//         // 여기서 bcrypt로 비교!
//         const isMatch = await bcrypt.compare(password, user.password);

//         if (isMatch) {
//             return { success: true, user: { name: user.name, email: user.email } };
//         } else {
//             return { success: false, message: "비밀번호가 일치하지 않습니다." };
//         }
//     } catch (error) {
//         return { success: false, message: "서버 오류 발생" };
//     }
// };

const login = async (userData, res) => {
    try {
        const { email, password } = userData;
        const user = await User.findOne({ email });

        if (!user) {
            return { success: false, message: "가입되지 않은 이메일입니다." };
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return { success: false, message: "비밀번호가 일치하지 않습니다." };
        }

        // JWT 생성
        const token = jwt.sign(
            { email: user.email, id: user._id },
            SECRET,
            { expiresIn: '1h' }
        );

        // 쿠키 저장
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // 개발환경 false
            sameSite: 'Lax'
        });

        return { success: true, user: { name: user.name, email: user.email } };

    } catch (error) {
        return { success: false, message: "서버 오류 발생" };
    }
};

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "토큰 없음" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "토큰 유효하지 않음" });
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

// 비밀번호 변경
const changePassword = async (userData) => {
    try {
        const { email, newPassword } = userData;

        const user = await User.findOne({ email });

        if (!user) {
            return { success: false, message: "유저 없음" };
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        await user.save();

        return { success: true };

    } catch (error) {
        return { success: false, message: "서버 오류" };
    }
};


// router.post("/check-password", async (req, res) => {
//     const result = await checkPassword(req.body);
//     res.json(result);
// });
router.post("/change-password", authMiddleware, async (req, res) => {
    try {
        const { newPassword } = req.body;

        const user = await User.findOne({ email: req.user.email });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.json({ success: true });

    } catch (e) {
        res.status(500).json({ success: false });
    }
});

router.post("/login", async (req, res) => {
    const result = await login(req.body);
    res.json(result);
});

router.post("/signup", async (req, res) => {
    const result = await join(req.body);
    res.json(result);
});

router.post("/change-password", async (req, res) => {
    const result = await changePassword(req.body);
    res.json(result);
});

router.get('/me', (req, res) => {
    const token = req.cookies.token

    if (!token) {
        return res.json({ success: false })
    }

    try {
        const decoded = jwt.verify(token, SECRET)
        return res.json({ success: true, user: decoded })
    } catch (e) {
        return res.json({ success: false })
    }
})

router.post('/logout', (req, res) => {
    res.clearCookie('token')
    res.json({ success: true })
})

module.exports = router;