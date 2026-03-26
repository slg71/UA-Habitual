const express = require('express');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/perfil', verifyToken, (req, res) => {
    res.json({ message: 'Bienvenido a tu perfil', user: req.user });
});

module.exports = router;
