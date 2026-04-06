const express = require('express');
const {
    getAllCommunities,
    getCommunityById,
    getCommunityMembers,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    getUserCommunities
} = require('../controllers/communitiesController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/communities', getAllCommunities);
router.get('/communities/:id', getCommunityById);
router.get('/communities/:id/members', getCommunityMembers);
router.get('/user/communities', verifyToken, getUserCommunities);

router.post('/communities', verifyToken, createCommunity);
router.post('/communities/:id/join', verifyToken, joinCommunity);

router.delete('/communities/:id/leave', verifyToken, leaveCommunity);

module.exports = router;
