const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getUserProfile = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT 
            u.id, u.username, u.email, u.avatar_url, u.banner_url, u.score, u.streak, u.last_post_date, u.rank_id,
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
            u.id, u.username, u.avatar_url, u.banner_url, u.score, u.streak, u.last_post_date, u.rank_id,
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
    const { username, email, password } = req.body || {};
    const avatarFile = req.files?.avatar?.[0] || null;
    const bannerFile = req.files?.banner?.[0] || null;
    const avatarUrl = avatarFile ? `/uploads/profiles/${avatarFile.filename}` : null;
    const bannerUrl = bannerFile ? `/uploads/profiles/${bannerFile.filename}` : null;

    if (!username && !email && !password && !avatarUrl && !bannerUrl) {
        return res.status(400).json({
            error: 'Envía al menos username, email, password, avatar o banner'
        });
    }

    const updateUser = () => {
        const fields = [];
        const params = [];

        if (username) {
            fields.push('username = ?');
            params.push(username);
        }
        if (email) {
            fields.push('email = ?');
            params.push(email);
        }
        if (avatarUrl) {
            fields.push('avatar_url = ?');
            params.push(avatarUrl);
        }
        if (bannerUrl) {
            fields.push('banner_url = ?');
            params.push(bannerUrl);
        }

        const executeUpdate = (hashedPassword) => {
            if (hashedPassword) {
                fields.push('password_hash = ?');
                params.push(hashedPassword);
            }

            // Validar que hay al menos un campo para actualizar
            if (fields.length === 0) {
                return res.status(400).json({ error: 'No hay cambios para guardar' });
            }

            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            params.push(userId);

            db.execute(query, params, (err) => {
                if (err) {
                    console.error('Error al actualizar perfil:', err);
                    return res.status(500).json({ error: 'Error al actualizar perfil' });
                }
                return res.json({
                    message: 'Perfil actualizado',
                    avatar_url: avatarUrl,
                    banner_url: bannerUrl
                });
            });
        };

        if (password) {
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al procesar password' });
                }
                executeUpdate(hashedPassword);
            });
        } else {
            executeUpdate();
        }
    };

    const checkEmail = (done) => {
        if (!email) return done();

        const checkQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
        db.execute(checkQuery, [email, userId], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Error al verificar email' });
            if (rows.length > 0) return res.status(400).json({ error: 'El email ya está en uso' });
            done();
        });
    };

    const checkUsername = (done) => {
        if (!username) return done();

        const checkQuery = 'SELECT id FROM users WHERE username = ? AND id != ?';
        db.execute(checkQuery, [username, userId], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Error al verificar nombre de usuario' });
            if (rows.length > 0) return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
            done();
        });
    };

    checkUsername(() => checkEmail(updateUser));
};

const deleteProfile = (req, res) => {
    const userId = req.user.id;
    const { password } = req.body || {};

    if (!password) {
        return res.status(400).json({ error: 'La contraseña es obligatoria para eliminar la cuenta' });
    }

    const verifyQuery = 'SELECT password_hash FROM users WHERE id = ?';
    db.execute(verifyQuery, [userId], async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar la contraseña' });
        }
        if (!rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const passwordHash = rows[0].password_hash;
        const isMatch = await bcrypt.compare(password, passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const deleteOwnLikes = 'DELETE FROM post_likes WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)';
        const deleteOwnComments = 'DELETE FROM comments WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)';
        const deleteOwnGoals = 'DELETE FROM goals WHERE user_id = ?';
        const deleteFollows = 'DELETE FROM follows WHERE follower_id = ? OR following_id = ?';
        const deleteCommunities = 'DELETE FROM user_communities WHERE user_id = ?';
        const deletePosts = 'DELETE FROM posts WHERE user_id = ?';
        const deleteUser = 'DELETE FROM users WHERE id = ?';

        db.execute(deleteOwnLikes, [userId, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Error al eliminar likes' });
            db.execute(deleteOwnComments, [userId, userId], (err) => {
                if (err) return res.status(500).json({ error: 'Error al eliminar comentarios' });
                db.execute(deleteOwnGoals, [userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Error al eliminar metas' });
                    db.execute(deleteFollows, [userId, userId], (err) => {
                        if (err) return res.status(500).json({ error: 'Error al eliminar seguimiento' });
                        db.execute(deleteCommunities, [userId], (err) => {
                            if (err) return res.status(500).json({ error: 'Error al eliminar comunidades' });
                            db.execute(deletePosts, [userId], (err) => {
                                if (err) return res.status(500).json({ error: 'Error al eliminar publicaciones' });
                                db.execute(deleteUser, [userId], (err) => {
                                    if (err) return res.status(500).json({ error: 'Error al eliminar cuenta' });
                                    return res.json({ message: 'Cuenta eliminada correctamente' });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
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
    deleteProfile,
    getLeaderboard,
    searchUsers
};
