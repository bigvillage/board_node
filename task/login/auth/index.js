const util = require("../../../lib/util.js");
const svc = require("./service");

// POST /api/login/auth (로그인 또는 회원가입)
const post = async (req, res, qObj) => {
    // 데이터 존재 여부에 따라 서비스에서 처리
    if (qObj.isSignup) {
        // 회원가입
        svc.join(qObj, (error, result) => {
            if (error) return util.writeError(error, res);
            util.writeSuccess(result, res);
        });
    } else {
        // 로그인
        svc.login(qObj, res, (error, result) => {
            if (error) return util.writeError(error, res);
            util.writeSuccess(result, res);
        });
    }
};

// GET /api/login/auth (내 정보 확인 - me)
const get = async (req, res, qObj) => {
    svc.getMe(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

module.exports = { post, get };