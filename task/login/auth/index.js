const util = require("../../../../lib/util");
const svc = require("./service");

const post = async (req, res, qObj) => {
    svc.handleAuth(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

const get = async (req, res, qObj) => {
    svc.getMe(req, res, qObj, (error, result) => {
        if (error) return util.writeError(error, res);
        util.writeSuccess(result, res);
    });
};

module.exports = { post, get };