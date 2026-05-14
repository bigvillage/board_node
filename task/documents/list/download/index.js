const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const get = async (req, res, qObj) => {
    try {
        const s3 = new S3Client({
            region: "auto",
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });

        // 1. URL에서 순수 파일명(Key)만 정밀하게 추출
        const fullUrl = req.url; 
        // url= 뒤의 주소만 가져오기 위해 정규식 사용
        const urlMatch = fullUrl.match(/url=([^&]+)/);
        let rawFileUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : "";
        
        // 도메인 부분을 제외한 순수 파일명만 추출 (https://.../filename.ext)
        // URL에 쿼리가 섞여있을 수 있으므로 ? 앞까지만 자름
        const fileKey = rawFileUrl.split('/').pop().split('?')[0]; 
        const originalName = qObj.name || "download_file";

        console.log("R2에 요청할 Key 값:", fileKey); // 👈 이 로그가 R2 대시보드의 파일명과 일치해야 함

        if (!fileKey) {
            return res.status(400).json({ success: false, message: "Key 추출 실패" });
        }

        // 2. R2 명령어 실행
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || "document-system",
            Key: fileKey,
        });

        const response = await s3.send(command);

        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(originalName)}`);
        res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');

        response.Body.pipe(res);

    } catch (error) {
        if (error.name === "NoSuchKey") {
            console.error("파일이 버킷에 없습니다. Key 확인 필요.");
        }
        console.error("R2 Error:", error);
        res.status(500).json({ success: false, message: "파일을 찾을 수 없습니다 (404)." });
    }
};

module.exports = { get };