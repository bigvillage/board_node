const User = require("./models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "my_secret_key";

// 회원가입
const join = async (qObj, callback) => {
    try {
        const { name, email, password } = qObj;
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        callback(null, { message: "회원가입이 완료되었습니다!" });
    } catch (error) {
        if (error.code === 11000) {
            callback({ status: 400, message: "이미 사용 중인 이메일입니다." });
        } else {
            callback(error);
        }
    }
};

// 로그인
const login = async (qObj, res, callback) => {
    try {
        const { email, password } = qObj;
        const user = await User.findOne({ email });

        if (!user) {
            return callback({ status: 401, message: "가입되지 않은 이메일입니다." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return callback({ status: 401, message: "비밀번호가 일치하지 않습니다." });
        }

        // JWT 생성
        const token = jwt.sign(
            { email: user.email, id: user._id, name: user.name },
            SECRET,
            { expiresIn: '1h' }
        );

        // 쿠키 저장
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,   // http 환경(localhost)이므로 false가 맞습니다.
            sameSite: 'lax', // 'none'으로 설정하면 secure: true가 필수라 로컬에서 깨집니다. 'lax'가 정석입니다.
            path: '/',       // 모든 경로에서 쿠키를 보낼 수 있도록 지정
            maxAge: 3600000
        });

        callback(null, { name: user.name, email: user.email });
    } catch (error) {
        callback(error);
    }
};

// 내 정보 가져오기
const getMe = async (req, res, qObj, callback) => {
    // 이미 app.was.js의 checkLogin에서 qObj.user에 유저 정보를 담아줬으므로 바로 활용
    if (qObj.user) {
        callback(null, { user: qObj.user });
    } else {
        callback({ status: 401, message: "인증되지 않은 사용자입니다." });
    }
};

module.exports = { join, login, getMe };