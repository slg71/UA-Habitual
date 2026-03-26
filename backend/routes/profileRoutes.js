const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const db = require('../config/db');

const router = express.Router();

router.get('/perfil', verifyToken, (req, res) => {
    const query = `
        SELECT u.id, u.username, u.email, u.score, u.streak, u.last_post_date, u.rank_id, r.name AS rank_name
        FROM users u
        LEFT JOIN rank_levels r ON r.id = u.rank_id
        WHERE u.id = ?
    `;

    db.execute(query, [req.user.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar perfil' });
        }
        if (!rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.json(rows[0]);
    });
});

module.exports = router;
