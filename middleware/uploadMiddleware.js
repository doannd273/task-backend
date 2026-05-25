const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp.ext
    const ext = path.extname(file.originalname);
    const filename = `${req.user._id}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const genericFileMimeTypes = new Set(['application/octet-stream', 'binary/octet-stream']);
const jpegExtensions = new Set(['.jpg', '.jpeg']);

const getFileExtension = (filename) => path.extname(filename || '').toLowerCase();

// File filter (only images)
const fileFilter = (req, file, cb) => {
  const ext = getFileExtension(file.originalname);
  const hasAllowedMimeType = allowedMimeTypes.has(file.mimetype);
  const hasAllowedExtension = allowedExtensions.has(ext);
  const hasGenericMimeType = genericFileMimeTypes.has(file.mimetype);

  // Some API clients send local files as application/octet-stream.
  if (hasAllowedMimeType || (hasGenericMimeType && hasAllowedExtension)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPG, PNG and WEBP are allowed.');
    error.code = 'UPLOAD_INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const hasPngSignature = (buffer) =>
  buffer.length >= 8 &&
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47 &&
  buffer[4] === 0x0d &&
  buffer[5] === 0x0a &&
  buffer[6] === 0x1a &&
  buffer[7] === 0x0a;

const hasJpegSignature = (buffer) =>
  buffer.length >= 3 &&
  buffer[0] === 0xff &&
  buffer[1] === 0xd8 &&
  buffer[2] === 0xff;

const hasWebpSignature = (buffer) =>
  buffer.length >= 12 &&
  buffer.toString('ascii', 0, 4) === 'RIFF' &&
  buffer.toString('ascii', 8, 12) === 'WEBP';

const isAllowedUploadedImage = async (file) => {
  if (!file?.path) return false;

  const ext = getFileExtension(file.originalname);
  if (!allowedExtensions.has(ext)) return false;

  const buffer = await fs.promises.readFile(file.path);

  if (ext === '.png') return hasPngSignature(buffer);
  if (jpegExtensions.has(ext)) return hasJpegSignature(buffer);
  if (ext === '.webp') return hasWebpSignature(buffer);

  return false;
};

const removeUploadedFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error('Failed to remove invalid uploaded file:', error.message);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
module.exports.isAllowedUploadedImage = isAllowedUploadedImage;
module.exports.removeUploadedFile = removeUploadedFile;
