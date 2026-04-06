const express = require('express');
const {
    createComment,
    getPostComments,
    getNestedComments,
    deleteComment
} = require('../controllers/commentsController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/posts/:post_id/comments', getPostComments);
router.get('/posts/:post_id/comments/nested', getNestedComments);

router.post('/comments', verifyToken, createComment);

router.delete('/comments/:id', verifyToken, deleteComment);

module.exports = router;
