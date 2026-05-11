const express = require('express');
const {
    createPost,
    getPostsByCommunity,
    getPostById,
    deletePost,
    getPostsForUser,
    getPostsByUserId,
    getFollowingPosts
} = require('../controllers/postsController');
const verifyToken = require('../middleware/verifyToken');
const uploadPostMedia = require('../middleware/uploadPostMedia');

const router = express.Router();

router.get('/posts/user', verifyToken, getPostsForUser);
router.get('/users/:user_id/posts', getPostsByUserId);
router.get('/posts/feed/following', verifyToken, getFollowingPosts);
router.get('/posts/:id', getPostById);
router.get('/community/:community_id/posts', getPostsByCommunity);

router.post('/posts', verifyToken, uploadPostMedia.array('media', 10), createPost);

router.delete('/posts/:id', verifyToken, deletePost);

module.exports = router;
