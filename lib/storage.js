/**
 * File storage: local disk (default) or optional AWS S3.
 */
const fs = require("fs");
const path = require("path");

const uploadRoot = path.join(__dirname, "..", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
}

function isS3Enabled() {
  return !!(
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

function localPublicUrl(req, filename) {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
}

function s3PublicUrl(key) {
  const region = process.env.AWS_REGION || "us-east-1";
  const bucket = process.env.AWS_S3_BUCKET;
  if (process.env.AWS_S3_PUBLIC_BASE_URL) {
    return `${process.env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function uploadToS3(localPath, key) {
  let S3Client;
  let PutObjectCommand;
  try {
    ({ S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"));
  } catch {
    throw new Error(
      "AWS S3 configured but @aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3"
    );
  }
  const body = fs.readFileSync(localPath);
  const client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: "application/octet-stream",
    })
  );
  return s3PublicUrl(key);
}

/**
 * After multer saves locally, optionally mirror to S3 and return public URL.
 */
async function publishUploadedFile(req, filename) {
  ensureUploadDir();
  const localPath = path.join(uploadRoot, filename);
  if (isS3Enabled() && fs.existsSync(localPath)) {
    const key = `uploads/${filename}`;
    return uploadToS3(localPath, key);
  }
  return localPublicUrl(req, filename);
}

module.exports = {
  uploadRoot,
  ensureUploadDir,
  isS3Enabled,
  localPublicUrl,
  publishUploadedFile,
};
