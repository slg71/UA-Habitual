const express = require('express');
const {
    createGoal,
    getUserGoals,
    getGoalById,
    updateGoal,
    completeGoal,
    deleteGoal,
    getUserLevelProgress
} = require('../controllers/goalsController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/goals', verifyToken, getUserGoals);
router.get('/goals/user/level-progress', verifyToken, getUserLevelProgress);
router.get('/goals/:id', verifyToken, getGoalById);

router.post('/goals', verifyToken, createGoal);

router.put('/goals/:id', verifyToken, updateGoal);
router.patch('/goals/:id/complete', verifyToken, completeGoal);

router.delete('/goals/:id', verifyToken, deleteGoal);

module.exports = router;
