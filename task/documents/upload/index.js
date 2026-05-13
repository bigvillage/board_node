const util = require("../../../../lib/util");
const svc = require("./service");

const post = async (req, res, qObj) => {
    // 새 문서 등록
    svc.upload(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

const put = async (req, res, qObj) => {
    // 문서 수정
    svc.update(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

const del = async (req, res, qObj) => {
    // 문서 삭제
    svc.remove(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

module.exports = { post, put, del };