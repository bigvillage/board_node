const util = require("../../../lib/util.js");
const svc = require("./service");

// POST /api/documents/upload (신규 등록)
const post = async (req, res, qObj) => {
    svc.processUpload(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

// PUT /api/documents/upload (문서 수정)
const put = async (req, res, qObj) => {
    svc.updateDocument(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

// DELETE /api/documents/upload (문서 삭제)
const del = async (req, res, qObj) => {
    svc.deleteDocument(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

// PATCH /api/documents/upload (즐겨찾기 토글)
const patch = async (req, res, qObj) => {
    svc.toggleFavorite(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

module.exports = { post, put, del, patch };