const Upload = require("../upload/models/upload");
const axios = require("axios");

// 문서 리스트 조회 (일반/즐겨찾기 통합)
const fetchDocuments = async (req, res, qObj, callback) => {
    try {
        const page = parseInt(qObj.page) || 1;
        const limit = parseInt(qObj.limit) || 5;
        const skip = (page - 1) * limit;

        // 즐겨찾기 모드 체크 (쿼리 파라미터 isFavorite=true 여부)
        const query = {};
        if (qObj.isFavorite === 'true' || qObj.type === 'favorite') {
            query.isFavorite = true;
        }

        // 전체 개수 확인
        const total = await Upload.countDocuments(query);

        // 데이터 조회
        const documents = await Upload.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        callback(null, { documents, total });
    } catch (error) {
        callback(error);
    }
};

// Elasticsearch 전문 검색
const searchDocuments = async (req, res, qObj, callback) => {
    try {
        const { q } = qObj; // 검색어

        if (!q) {
            return callback({ status: 400, message: "검색어를 입력해주세요." });
        }

        const esRes = await axios.post(
            `${process.env.ES_URL}/documents/_search`,
            {
                query: {
                    wildcard: {
                        title: `*${q}*`
                    }
                }
            },
            {
                auth: {
                    username: 'elastic',
                    password: process.env.ES_PASSWORD || "123!@#qwe"
                }
            }
        );

        const hits = esRes.data.hits.hits;
        const result = hits.map(hit => ({
            _id: hit._id,
            ...hit._source
        }));

        callback(null, result);
    } catch (error) {
        console.error('Search Error:', error.response?.data || error.message);
        callback(error);
    }
};

module.exports = { fetchDocuments, searchDocuments };