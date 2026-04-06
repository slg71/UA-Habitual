const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getUserProfile = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT 
            u.id, u.username, u.email, u.score, u.streak, u.last_post_date, u.rank_id,
            r.name as rank_name,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
            (SELECT COUNT(*) FROM goals WHERE user_id = u.id AND status = 'completed') as completed_goals
        FROM users u
        LEFT JOIN rank_levels r ON r.id = u.rank_id
        WHERE u.id = ?
    `;

    db.execute(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar perfil' });
        }
        if (!rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(rows[0]);
    });
};

const getPublicProfile = (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT 
            u.id, u.username, u.score, u.streak, u.last_post_date, u.rank_id,
            r.name as rank_name,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
            (SELECT COUNT(*) FROM goals WHERE user_id = u.id AND status = 'completed') as completed_goals
        FROM users u
        LEFT JOIN rank_levels r ON r.id = u.rank_id
        WHERE u.id = ?
    `;

    db.execute(query, [user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar perfil' });
        }
        if (!rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(rows[0]);
    });
};

const updateProfile = (req, res) => {
    const userId = req.user.id;
    const { email, password } = req.body || {};

    if (!email && !password) {
        return res.status(400).json({
            error: 'Envía al menos email o password'
        });
    }

    if (email) {
        // Verificar que el email no esté en uso
        const checkQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
        db.execute(checkQuery, [email, userId], (err, rows) => {
            if (err || rows.length > 0) {
                return res.status(400).json({ error: 'El email ya está en uso' });
            }

            let query = 'UPDATE users SET email = ?';
            const params = [email];

            if (password) {
                // Hash del nuevo password
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al procesar password' });
                    }
                    query += ', password_hash = ?';
                    params.push(hashedPassword);
                    params.push(userId);
                    query += ' WHERE id = ?';

                    db.execute(query, params, (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Error al actualizar perfil' });
                        }
                        return res.json({ message: 'Perfil actualizado' });
                    });
                });
            } else {
                params.push(userId);
                query += ' WHERE id = ?';
                db.execute(query, params, (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al actualizar perfil' });
                    }
                    return res.json({ message: 'Perfil actualizado' });
                });
            }
        });
    } else if (password) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Error al procesar password' });
            }
            const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
            db.execute(query, [hashedPassword, userId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al actualizar perfil' });
                }
                return res.json({ message: 'Perfil actualizado' });
            });
        });
    }
};

const getLeaderboard = (req, res) => {
    const { limit, offset, category } = req.query;
    const limitVal = Math.min(parseInt(limit) || 100, 1000);
    const offsetVal = parseInt(offset) || 0;

    let query = `
        SELECT 
            u.id, u.username, u.score, u.streak, u.rank_id,
            r.name as rank_name,
            ROW_NUMBER() OVER (ORDER BY u.score DESC) as position
        FROM users u
        LEFT JOIN rank_levels r ON r.id = u.rank_id
    `;

    if (category) {
        // Leaderboard por categoría (comunidad)
        query = `
            SELECT 
                u.id, u.username, u.score, u.streak, u.rank_id,
                r.name as rank_name,
                ROW_NUMBER() OVER (ORDER BY u.score DESC) as position
            FROM users u
            JOIN user_communities uc ON uc.user_id = u.id
            JOIN communities c ON c.id = uc.community_id
            LEFT JOIN rank_levels r ON r.id = u.rank_id
            WHERE c.name = ?
        `;
    }

    query += ' ORDER BY u.score DESC LIMIT ? OFFSET ?';

    const params = category ? [category, limitVal, offsetVal] : [limitVal, offsetVal];

    db.execute(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar leaderboard' });
        }
        return res.json(rows);
    });
};

const searchUsers = (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Búsqueda debe tener al menos 2 caracteres' });
    }

    const query = `
        SELECT 
            id, username, score, streak, rank_id,
            (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as follower_count
        FROM users
        WHERE username LIKE ?
        LIMIT 20
    `;

    db.execute(query, [`%${q}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al buscar usuarios' });
        }
        return res.json(rows);
    });
};

module.exports = {
    getUserProfile,
    getPublicProfile,
    updateProfile,
    getLeaderboard,
    searchUsers
};
