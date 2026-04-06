import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

// 1. R2 클라이언트 설정
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadTest() {
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: "test-file.txt", // R2에 저장될 파일 이름
    Body: "Hello R2! This is a test upload.", // 파일 내용
    ContentType: "text/plain",
  };

  try {
    const data = await s3.send(new PutObjectCommand(params));
    console.log("✅ 업로드 성공!", data);
  } catch (err) {
    console.error("❌ 업로드 실패:", err);
  }
}

uploadTest();