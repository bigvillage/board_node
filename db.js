const mongoose = require('mongoose');
const config = require('./config.json');

// MongoDB 연결 함수
const connectDB = async () => {
    try {
        // config.json에 "MONGO_URI": "mongodb://localhost:27017/docsearch" 형태가 있어야 함
        await mongoose.connect(config.MONGO_URI);
        console.log("✅ MongoDB 연결 성공");
    } catch (err) {
        console.error("❌ MongoDB 연결 실패:", err);
        process.exit(1);
    }
};

module.exports = connectDB;