const express = require('express');
const {
    getUserProfile,
    getPublicProfile,
    updateProfile,
    getLeaderboard,
    searchUsers
} = require('../controllers/usersController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/profile', verifyToken, getUserProfile);
router.get('/users/:user_id', getPublicProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/users/search', searchUsers);

router.put('/profile', verifyToken, updateProfile);

module.exports = router;
