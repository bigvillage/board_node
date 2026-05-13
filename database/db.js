const mongoose = require('mongoose');
const config = require('../config.json');

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) return;
        await mongoose.connect(config.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
};

module.exports = connectDB;