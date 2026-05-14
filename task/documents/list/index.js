const util = require("../../../lib/util.js");
const svc = require("./service");

// GET /api/documents/list (목록 조회 및 즐겨찾기 목록)
const get = async (req, res, qObj) => {
    // 쿼리 파라미터에 type=favorite 등이 있을 경우를 서비스에서 처리하도록 전달
    svc.fetchDocuments(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

// POST /api/documents/list (Elasticsearch 전문 검색)
const post = async (req, res, qObj) => {
    svc.searchDocuments(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

module.exports = { get, post };