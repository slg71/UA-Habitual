const express = require('express');
const {
    likePost,
    unlikePost,
    getPostLikes,
    getPostLikeCount,
    hasUserLikedPost
} = require('../controllers/likesController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/posts/:post_id/likes', getPostLikes);
router.get('/posts/:post_id/likes/count', getPostLikeCount);
router.get('/posts/:post_id/user-like', verifyToken, hasUserLikedPost);

router.post('/posts/:post_id/like', verifyToken, likePost);

router.delete('/posts/:post_id/like', verifyToken, unlikePost);

module.exports = router;
