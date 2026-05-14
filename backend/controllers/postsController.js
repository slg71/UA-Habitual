const db = require('../config/db');

const createPost = async (req, res) => {
    const { content, community_id } = req.body || {};
    const userId = req.user.id;
    const files = req.files || [];

    if (!content || !community_id) {
        return res.status(400).json({
            error: 'Body inválido. Envía { content, community_id }'
        });
    }

    try {
        // Verificar que el usuario está en la comunidad
        const checkQuery = 'SELECT 1 FROM user_communities WHERE user_id = ? AND community_id = ?';
        const [checkResult] = await db.promise().execute(checkQuery, [userId, community_id]);
        
        if (!checkResult.length) {
            return res.status(403).json({ error: 'No estás unido a esta comunidad' });
        }

        // Crear el post
        const insertPostQuery = 'INSERT INTO posts (user_id, community_id, content) VALUES (?, ?, ?)';
        const [postResult] = await db.promise().execute(insertPostQuery, [userId, community_id, content]);
        const postId = postResult.insertId;

        // Si no hay archivos, responder directamente
        if (files.length === 0) {
            return res.status(201).json({
                message: 'Post creado con éxito',
                postId: postId,
                media_list: []
            });
        }

        // Procesar todas las medias
        const mediaPromises = files.map(async (file) => {
            const mediaUrl = `/uploads/posts/${file.filename}`;
            const mediaType = file.mimetype.startsWith('image/') ? 'image' : 
                             file.mimetype.startsWith('video/') ? 'video' : 
                             file.mimetype.startsWith('audio/') ? 'audio' : 'other';
            const mediaMetadata = JSON.stringify({
                mime_type: file.mimetype,
                original_name: file.originalname,
                size: file.size
            });

            // Insertar media
            const insertMediaQuery = 'INSERT INTO media (type, url, metadata) VALUES (?, ?, ?)';
            const [mediaResult] = await db.promise().execute(insertMediaQuery, [mediaType, mediaUrl, mediaMetadata]);
            
            // Vincular media al post
            const linkMediaQuery = 'INSERT INTO post_media (post_id, media_id) VALUES (?, ?)';
            await db.promise().execute(linkMediaQuery, [postId, mediaResult.insertId]);

            return { url: mediaUrl, type: mediaType };
        });

        const mediaList = await Promise.all(mediaPromises);

        return res.status(201).json({
            message: 'Post creado con éxito',
            postId: postId,
            media_list: mediaList
        });

    } catch (error) {
        console.error('Error creando post:', error);
        return res.status(500).json({ error: 'Error al crear post' });
    }
};

const promiseDb = db.promise();

const parseMediaList = (row) => {
    let media_list = [];
    
    if (row.media_list) {
        if (Array.isArray(row.media_list)) {
            media_list = row.media_list.filter(m => m && m.url);
        } else if (typeof row.media_list === 'string') {
            try {
                media_list = JSON.parse(row.media_list).filter(m => m && m.url);
            } catch (e) {
                console.error('Error parsing media_list JSON:', e);
                media_list = [];
            }
        }
    }
    
    return {
        ...row,
        media_list,
        media_url: media_list.length ? media_list[0].url : null,
        media_type: media_list.length ? media_list[0].type : null
    };
};

const getPostsByCommunity = async (req, res) => {
    const { community_id } = req.params;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.id as user_db_id, u.username, u.score, u.streak,
            JSON_ARRAYAGG(JSON_OBJECT('url', m.url, 'type', m.type)) as media_list,
            COUNT(DISTINCT pl.user_id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN post_media pm ON pm.post_id = p.id
        LEFT JOIN media m ON m.id = pm.media_id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN comments c ON c.post_id = p.id
        WHERE p.community_id = ?
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.id, u.username, u.score, u.streak
        ORDER BY p.created_at DESC
    `;

    try {
        const [rows] = await promiseDb.execute(query, [community_id]);
        return res.json(rows.map(parseMediaList));
    } catch (error) {
        console.error('Error al cargar posts por comunidad:', error);
        return res.status(500).json({ error: 'Error al cargar posts' });
    }
};

const getPostById = async (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.id as user_db_id, u.username, u.score, u.streak,
            JSON_ARRAYAGG(JSON_OBJECT('url', m.url, 'type', m.type)) as media_list,
            COUNT(DISTINCT pl.user_id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN post_media pm ON pm.post_id = p.id
        LEFT JOIN media m ON m.id = pm.media_id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN comments c ON c.post_id = p.id
        WHERE p.id = ?
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.id, u.username, u.score, u.streak
    `;

    try {
        const [rows] = await promiseDb.execute(query, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        return res.json(parseMediaList(rows[0]));
    } catch (error) {
        console.error('Error al cargar post:', error);
        return res.status(500).json({ error: 'Error al cargar post' });
    }
};

const deletePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [rows] = await promiseDb.execute('SELECT user_id FROM posts WHERE id = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'No puedes eliminar este post' });
        }

        await promiseDb.execute('DELETE FROM posts WHERE id = ?', [id]);
        return res.json({ message: 'Post eliminado' });
    } catch (error) {
        console.error('Error al eliminar post:', error);
        return res.status(500).json({ error: 'Error al eliminar post' });
    }
};

const getPostsForUser = async (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.id as user_db_id, u.username, u.score, u.streak,
            c.id as community_db_id, c.name as community_name,
            JSON_ARRAYAGG(JSON_OBJECT('url', m.url, 'type', m.type)) as media_list,
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
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.id, u.username, u.score, u.streak, c.id, c.name
        ORDER BY p.created_at DESC
    `;

    try {
        const [rows] = await promiseDb.execute(query, [userId]);
        return res.json(rows.map(parseMediaList));
    } catch (error) {
        console.error('Error al cargar posts del usuario:', error);
        return res.status(500).json({ error: 'Error al cargar posts' });
    }
};

const getPostsByUserId = async (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.id as user_db_id, u.username, u.score, u.streak,
            c.id as community_db_id, c.name as community_name,
            JSON_ARRAYAGG(JSON_OBJECT('url', m.url, 'type', m.type)) as media_list,
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
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.id, u.username, u.score, u.streak, c.id, c.name
        ORDER BY p.created_at DESC
    `;

    try {
        const [rows] = await promiseDb.execute(query, [user_id]);
        return res.json(rows.map(parseMediaList));
    } catch (error) {
        console.error('Error al cargar posts del usuario por ID:', error);
        return res.status(500).json({ error: 'Error al cargar posts' });
    }
};

const getFollowingPosts = async (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT 
            p.id, p.user_id, p.community_id, p.content, p.created_at,
            u.id as user_db_id, u.username, u.score, u.streak,
            c.id as community_db_id, c.name as community_name,
            JSON_ARRAYAGG(JSON_OBJECT('url', m.url, 'type', m.type)) as media_list,
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
        GROUP BY p.id, p.user_id, p.community_id, p.content, p.created_at, u.id, u.username, u.score, u.streak, c.id, c.name
        ORDER BY p.created_at DESC
        LIMIT 50
    `;

    try {
        const [rows] = await promiseDb.execute(query, [userId]);
        return res.json(rows.map(parseMediaList));
    } catch (error) {
        console.error('Error al cargar posts de los seguidos:', error);
        return res.status(500).json({ error: 'Error al cargar posts' });
    }
};

module.exports = {
    createPost,
    getPostsByCommunity,
    getPostById,
    deletePost,
    getPostsForUser,
    getPostsByUserId,
    getFollowingPosts
};
