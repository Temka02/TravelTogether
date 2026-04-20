const { s3Client, BUCKET_NAME } = require("../config/s3");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

async function uploadFile(fileBuffer, mimetype, folder = "avatars") {
  const fileKey = `${folder}/${crypto.randomUUID()}-${Date.now()}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimetype,
  });
  await s3Client.send(command);
  return fileKey;
}

async function getFileUrl(fileKey, expiresIn = 3600) {
  if (!fileKey) return null;
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

async function deleteFile(fileKey) {
  if (!fileKey) return;
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  await s3Client.send(command);
}

module.exports = { uploadFile, getFileUrl, deleteFile };
