const express = require('express');
const {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowerCount,
    getFollowingCount,
    isFollowing
} = require('../controllers/followsController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/users/:user_id/followers', getFollowers);
router.get('/users/:user_id/following', getFollowing);
router.get('/users/:user_id/followers/count', getFollowerCount);
router.get('/users/:user_id/following/count', getFollowingCount);
router.get('/users/:user_id/is-following', verifyToken, isFollowing);

router.post('/users/:user_id/follow', verifyToken, followUser);

router.delete('/users/:user_id/unfollow', verifyToken, unfollowUser);

module.exports = router;
