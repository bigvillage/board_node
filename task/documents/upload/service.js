const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const Upload = require("./models/upload");

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

//문서 신규 업로드
const processUpload = async (req, res, qObj, callback) => {
    try {
        const { title, content, tags } = qObj;
        const files = qObj.files;

        if (!title || !files) return callback({ status: 400, message: "필수 데이터 누락" });

        const uploadedFiles = [];
        for (const file of files) {
            const utf8Name = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const fileKey = `${Date.now()}_${utf8Name}`;

            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));

            uploadedFiles.push({
                fileKey,
                originalName: utf8Name,
                size: file.size,
                fileUrl: `${process.env.R2_PUBLIC_URL}/${fileKey}`
            });
        }

        const newDoc = new Upload({
            title,
            content,
            tags: typeof tags === 'string' ? JSON.parse(tags) : tags,
            files: uploadedFiles,
            userId: qObj.user?.id
        });

        await newDoc.save();

        // ES 동기화
        await axios.post(`${process.env.ES_URL}/documents/_doc/${newDoc._id}`, {
            title: newDoc.title,
            content: newDoc.content,
            files: newDoc.files.map(f => ({ originalName: f.originalName, fileUrl: f.fileUrl }))
        }, { auth: { username: 'elastic', password: process.env.ES_PASSWORD } });

        callback(null, newDoc);
    } catch (e) { callback(e); }
};

//문서 수정
const updateDocument = async (req, res, qObj, callback) => {
    try {
        const { id, title, content, tags } = qObj;
        const doc = await Upload.findById(id);
        if (!doc) return callback({ status: 404, message: "문서 없음" });

        // 파일 수정 로직 (기존에 작성하신 removedFiles 처리 등 포함 가능)
        doc.title = title || doc.title;
        doc.content = content || doc.content;
        doc.tags = tags ? JSON.parse(tags) : doc.tags;
        
        await doc.save();
        
        // ES 업데이트
        await axios.post(`${process.env.ES_URL}/documents/_update/${id}`, {
            doc: { title: doc.title, content: doc.content }
        }, { auth: { username: 'elastic', password: process.env.ES_PASSWORD } });

        callback(null, doc);
    } catch (e) { callback(e); }
};

//문서 삭제
const deleteDocument = async (req, res, qObj, callback) => {
    try {
        const { id } = qObj;
        const doc = await Upload.findById(id);
        if (!doc) return callback({ status: 404, message: "문서 없음" });

        for (const file of doc.files) {
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: file.fileKey }));
        }

        await Upload.findByIdAndDelete(id);
        await axios.delete(`${process.env.ES_URL}/documents/_doc/${id}`, {
            auth: { username: 'elastic', password: process.env.ES_PASSWORD }
        });

        callback(null, { message: "삭제 성공" });
    } catch (e) { callback(e); }
};

//즐겨찾기 토글
const toggleFavorite = async (req, res, qObj, callback) => {
    try {
        const { id, isFavorite } = qObj;
        const updated = await Upload.findByIdAndUpdate(id, { isFavorite }, { new: true });
        
        await axios.post(`${process.env.ES_URL}/documents/_update/${id}`, {
            doc: { isFavorite: updated.isFavorite }
        }, { auth: { username: 'elastic', password: process.env.ES_PASSWORD } });

        callback(null, updated);
    } catch (e) { callback(e); }
};

module.exports = { processUpload, updateDocument, deleteDocument, toggleFavorite };