const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const storageLib = require("../lib/storage");

async function publicFileUrl(req, filename) {
  return storageLib.publishUploadedFile(req, filename);
}

module.exports = { upload, uploadRoot, publicFileUrl };
