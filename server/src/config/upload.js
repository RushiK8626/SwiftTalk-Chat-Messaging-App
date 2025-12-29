const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads directory
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File Filter - Block potentially dangerous file types
const fileFilter = (req, file, cb) => {
  const blockedMimes = ['application/json', 'application/x-javascript', 'text/javascript'];

  if (blockedMimes.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed for security reasons`), false);
  }

  cb(null, true);
};

// Local Disk Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

// Multer Instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// File Type Helper
const getFileTypeCategory = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('excel') || mimetype.includes('sheet')) return 'spreadsheet';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'presentation';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return 'archive';
  return 'file';
};

module.exports = {
  upload,
  getFileTypeCategory
};