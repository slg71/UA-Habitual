const db = require('../config/db');

const likePost = (req, res) => {
    const { post_id } = req.params;
    const userId = req.user.id;

    // Verificar que el post existe
    const checkQuery = 'SELECT id FROM posts WHERE id = ?';
    db.execute(checkQuery, [post_id], (err, rows) => {
        if (err || !rows.length) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        const query = 'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)';
        db.execute(query, [userId, post_id], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Ya le diste like a este post' });
                }
                return res.status(500).json({ error: 'Error al dar like' });
            }
            return res.status(201).json({ message: 'Like agregado' });
        });
    });
};

const unlikePost = (req, res) => {
    const { post_id } = req.params;
    const userId = req.user.id;

    const query = 'DELETE FROM post_likes WHERE user_id = ? AND post_id = ?';
    db.execute(query, [userId, post_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al quitar like' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No habías dado like a este post' });
        }
        return res.json({ message: 'Like removido' });
    });
};

const getPostLikes = (req, res) => {
    const { post_id } = req.params;
    const query = `
        SELECT 
            u.id, u.username, u.email, u.score, u.streak,
            pl.created_at as liked_at
        FROM post_likes pl
        JOIN users u ON u.id = pl.user_id
        WHERE pl.post_id = ?
        ORDER BY pl.created_at DESC
    `;

    db.execute(query, [post_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar likes' });
        }
        return res.json(rows);
    });
};

const getPostLikeCount = (req, res) => {
    const { post_id } = req.params;
    const query = 'SELECT COUNT(*) as like_count FROM post_likes WHERE post_id = ?';

    db.execute(query, [post_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al contar likes' });
        }
        return res.json({ like_count: rows[0].like_count });
    });
};

const hasUserLikedPost = (req, res) => {
    const { post_id } = req.params;
    const userId = req.user.id;

    const query = 'SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?';
    db.execute(query, [userId, post_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar like' });
        }
        return res.json({ has_liked: rows.length > 0 });
    });
};

module.exports = {
    likePost,
    unlikePost,
    getPostLikes,
    getPostLikeCount,
    hasUserLikedPost
};
