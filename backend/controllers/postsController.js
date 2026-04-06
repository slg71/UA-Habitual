const db = require('../config/db');

const createPost = (req, res) => {
    const { content, community_id } = req.body || {};
    const userId = req.user.id;
    const mediaUrl = req.file ? `/uploads/posts/${req.file.filename}` : null;
    const mediaType = req.file?.mimetype?.startsWith('image/') ? 'image' : null;
    const mediaMetadata = req.file
        ? JSON.stringify({
            mime_type: req.file.mimetype,
            original_name: req.file.originalname,
            size: req.file.size
        })
        : null;

    if (!content || !community_id) {
        return res.status(400).json({
            error: 'Body inválido. Envía { content, community_id }'
        });
    }

    // Verificar que el usuario está en la comunidad
    const checkQuery = 'SELECT 1 FROM user_communities WHERE user_id = ? AND community_id = ?';
    db.execute(checkQuery, [userId, community_id], (err, rows) => {
        if (err || !rows.length) {
            return res.status(403).json({ error: 'No estás unido a esta comunidad' });
        }

        db.beginTransaction((txErr) => {
            if (txErr) {
                return res.status(500).json({ error: 'Error al crear post' });
            }

            const insertPostQuery = 'INSERT INTO posts (user_id, community_id, content) VALUES (?, ?, ?)';
            db.execute(insertPostQuery, [userId, community_id, content], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        return res.status(500).json({ error: 'Error al crear post' });
                    });
                }

                if (!mediaUrl) {
                    return db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                return res.status(500).json({ error: 'Error al crear post' });
                            });
                        }

                        return res.status(201).json({
                            message: 'Post creado con éxito',
                            postId: result.insertId,
                            media_url: null
                        });
                    });
                }

                const insertMediaQuery = 'INSERT INTO media (type, url, metadata) VALUES (?, ?, ?)';
                db.execute(insertMediaQuery, [mediaType, mediaUrl, mediaMetadata], (mediaErr, mediaResult) => {
                    if (mediaErr) {
                        return db.rollback(() => {
                            return res.status(500).json({ error: 'Error al guardar el contenido multimedia del post' });
                        });
                    }

                    const linkMediaQuery = 'INSERT INTO post_media (post_id, media_id) VALUES (?, ?)';
                    db.execute(linkMediaQuery, [result.insertId, mediaResult.insertId], (linkErr) => {
                        if (linkErr) {
                            return db.rollback(() => {
                                return res.status(500).json({ error: 'Error al guardar el contenido multimedia del post' });
                            });
                        }

                        return db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => {
                                    return res.status(500).json({ error: 'Error al guardar el contenido multimedia del post' });
                                });
                            }

                            return res.status(201).json({
                                message: 'Post creado con éxito',
                                postId: result.insertId,
                                media_url: mediaUrl
                            });
                        });
                    });
                });
            });
        });
    });
};

const getPostsByCommunity = (req, res) => {
    const { community_id } = req.params;
    const query = `
        SELECT 
            p.id, p.user_id, p.content, p.created_at,
            u.username, u.score, u.streak,
            MAX(m.url) as media_url,
            COUNT(DISTINCT pl.user_id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN post_media pm ON pm.post_id = p.id
        LEFT JOIN media m ON m.id = pm.media_id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN comments c ON c.post_id = p.id
        WHERE p.community_id = ?
        GROUP BY p.id, p.user_id, p.content, p.created_at, u.username, u.score, u.streak
        ORDER BY p.created_at DESC
    `;

    db.execute(query, [community_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar posts' });
        }
        return res.json(rows);
    });
};

const getPostById = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.username, u.score, u.streak,
            MAX(m.url) as media_url,
            COUNT(DISTINCT pl.user_id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN post_media pm ON pm.post_id = p.id
        LEFT JOIN media m ON m.id = pm.media_id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN comments c ON c.post_id = p.id
        WHERE p.id = ?
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.username, u.score, u.streak
    `;

    db.execute(query, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar post' });
        }
        if (!rows.length) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        return res.json(rows[0]);
    });
};

const deletePost = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el usuario es el propietario
    const checkQuery = 'SELECT user_id FROM posts WHERE id = ?';
    db.execute(checkQuery, [id], (err, rows) => {
        if (err || !rows.length) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'No puedes eliminar este post' });
        }

        const query = 'DELETE FROM posts WHERE id = ?';
        db.execute(query, [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar post' });
            }
            return res.json({ message: 'Post eliminado' });
        });
    });
};

const getPostsForUser = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.username, u.score, u.streak,
            c.name as community_name,
            MAX(m.url) as media_url,
            COUNT(DISTINCT pl.user_id) as likes_count,
            COUNT(DISTINCT com.id) as comments_count
        FROM posts p
        JOIN users u ON u.id = p.user_id
        JOIN communities c ON c.id = p.community_id
        LEFT JOIN post_media pm ON pm.post_id = p.id
        LEFT JOIN media m ON m.id = pm.media_id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN comments com ON com.post_id = p.id
        WHERE p.user_id = ?
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.username, u.score, u.streak, c.name
        ORDER BY p.created_at DESC
    `;

    db.execute(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar posts' });
        }
        return res.json(rows);
    });
};

const getFollowingPosts = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.username, u.score, u.streak,
            c.name as community_name,
            MAX(m.url) as media_url,
            COUNT(DISTINCT pl.user_id) as likes_count,
            COUNT(DISTINCT com.id) as comments_count
        FROM posts p
        JOIN users u ON u.id = p.user_id
        JOIN communities c ON c.id = p.community_id
        JOIN follows f ON f.following_id = p.user_id
        LEFT JOIN post_media pm ON pm.post_id = p.id
        LEFT JOIN media m ON m.id = pm.media_id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN comments com ON com.post_id = p.id
        WHERE f.follower_id = ?
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.username, u.score, u.streak, c.name
        ORDER BY p.created_at DESC
        LIMIT 50
    `;

    db.execute(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar posts' });
        }
        return res.json(rows);
    });
};

module.exports = {
    createPost,
    getPostsByCommunity,
    getPostById,
    deletePost,
    getPostsForUser,
    getFollowingPosts
};
