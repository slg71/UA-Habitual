const express = require('express');
const {
    createPost,
    getPostsByCommunity,
    getPostById,
    deletePost,
    getPostsForUser,
    getFollowingPosts
} = require('../controllers/postsController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/posts/user', verifyToken, getPostsForUser);
router.get('/posts/feed/following', verifyToken, getFollowingPosts);
router.get('/posts/:id', getPostById);
router.get('/community/:community_id/posts', getPostsByCommunity);

router.post('/posts', verifyToken, createPost);

router.delete('/posts/:id', verifyToken, deletePost);

module.exports = router;
