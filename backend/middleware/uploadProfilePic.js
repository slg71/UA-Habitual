const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '..', 'uploads', 'profiles');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        cb(null, uniqueName);
    }
});

const imageOnlyFilter = (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return cb(new Error('Solo se permiten imagenes.'));
    }
    cb(null, true);
};

const uploadProfilePic = multer({
    storage,
    fileFilter: imageOnlyFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadProfilePic;
