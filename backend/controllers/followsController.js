const db = require('../config/db');

const followUser = (req, res) => {
    const { user_id } = req.params;
    const followerId = req.user.id;

    if (parseInt(user_id) === followerId) {
        return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
    }

    // Verificar que el usuario existe
    const checkQuery = 'SELECT id FROM users WHERE id = ?';
    db.execute(checkQuery, [user_id], (err, rows) => {
        if (err || !rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const query = 'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)';
        db.execute(query, [followerId, user_id], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Ya sigues a este usuario' });
                }
                return res.status(500).json({ error: 'Error al seguir usuario' });
            }
            return res.status(201).json({ message: 'Ahora sigues a este usuario' });
        });
    });
};

const unfollowUser = (req, res) => {
    const { user_id } = req.params;
    const followerId = req.user.id;

    const query = 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?';
    db.execute(query, [followerId, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al dejar de seguir' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No estabas siguiendo a este usuario' });
        }
        return res.json({ message: 'Dejaste de seguir a este usuario' });
    });
};

const getFollowers = (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT 
            u.id, u.username, u.email, u.score, u.streak, u.rank_id,
            r.name as rank_name, f.created_at as followed_at
        FROM follows f
        JOIN users u ON u.id = f.follower_id
        LEFT JOIN rank_levels r ON r.id = u.rank_id
        WHERE f.following_id = ?
        ORDER BY u.score DESC
    `;

    db.execute(query, [user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar followers' });
        }
        return res.json(rows);
    });
};

const getFollowing = (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT 
            u.id, u.username, u.email, u.score, u.streak, u.rank_id,
            r.name as rank_name, f.created_at as followed_at
        FROM follows f
        JOIN users u ON u.id = f.following_id
        LEFT JOIN rank_levels r ON r.id = u.rank_id
        WHERE f.follower_id = ?
        ORDER BY u.score DESC
    `;

    db.execute(query, [user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar following' });
        }
        return res.json(rows);
    });
};

const getFollowerCount = (req, res) => {
    const { user_id } = req.params;
    const query = 'SELECT COUNT(*) as follower_count FROM follows WHERE following_id = ?';

    db.execute(query, [user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al contar followers' });
        }
        return res.json({ follower_count: rows[0].follower_count });
    });
};

const getFollowingCount = (req, res) => {
    const { user_id } = req.params;
    const query = 'SELECT COUNT(*) as following_count FROM follows WHERE follower_id = ?';

    db.execute(query, [user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al contar following' });
        }
        return res.json({ following_count: rows[0].following_count });
    });
};

const isFollowing = (req, res) => {
    const { user_id } = req.params;
    const followerId = req.user.id;

    const query = 'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?';
    db.execute(query, [followerId, user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar follow' });
        }
        return res.json({ is_following: rows.length > 0 });
    });
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowerCount,
    getFollowingCount,
    isFollowing
};
