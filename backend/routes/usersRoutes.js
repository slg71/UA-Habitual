const express = require('express');
const {
    getUserProfile,
    getPublicProfile,
    updateProfile,
    getLeaderboard,
    searchUsers
} = require('../controllers/usersController');
const verifyToken = require('../middleware/verifyToken');
const uploadProfilePic = require('../middleware/uploadProfilePic');

const router = express.Router();

router.get('/profile', verifyToken, getUserProfile);
router.get('/users/:user_id', getPublicProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/users/search', searchUsers);

// Wrapper para manejar errores de multer
const handleUploadErrors = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({ error: err.message || 'Error al procesar archivo' });
    }
    next();
};

router.put('/profile', verifyToken, uploadProfilePic.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), handleUploadErrors, updateProfile);

module.exports = router;
