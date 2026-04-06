const db = require('../config/db');

const createComment = (req, res) => {
    const { post_id, content, parent_id } = req.body || {};
    const userId = req.user.id;

    if (!post_id || !content) {
        return res.status(400).json({
            error: 'Body inválido. Envía { post_id, content, parent_id? }'
        });
    }

    const query = 'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)';
    db.execute(query, [post_id, userId, parent_id || null, content], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al crear comentario' });
        }
        return res.status(201).json({
            message: 'Comentario creado',
            commentId: result.insertId
        });
    });
};

const getPostComments = (req, res) => {
    const { post_id } = req.params;
    const query = `
        SELECT 
            c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at,
            u.username, u.score, u.streak
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `;

    db.execute(query, [post_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar comentarios' });
        }
        return res.json(rows);
    });
};

const getNestedComments = (req, res) => {
    const { post_id } = req.params;
    const query = `
        SELECT 
            c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at,
            u.username, u.score, u.streak
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ?
        ORDER BY c.parent_id ASC, c.created_at ASC
    `;

    db.execute(query, [post_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar comentarios' });
        }

        // Estructurar comentarios anidados
        const commentsMap = {};
        const rootComments = [];

        rows.forEach(comment => {
            commentsMap[comment.id] = { ...comment, replies: [] };
            if (!comment.parent_id) {
                rootComments.push(commentsMap[comment.id]);
            } else {
                if (commentsMap[comment.parent_id]) {
                    commentsMap[comment.parent_id].replies.push(commentsMap[comment.id]);
                }
            }
        });

        return res.json(rootComments);
    });
};

const deleteComment = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el usuario es el propietario
    const checkQuery = 'SELECT user_id FROM comments WHERE id = ?';
    db.execute(checkQuery, [id], (err, rows) => {
        if (err || !rows.length) {
            return res.status(404).json({ error: 'Comentario no encontrado' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'No puedes eliminar este comentario' });
        }

        const query = 'DELETE FROM comments WHERE id = ?';
        db.execute(query, [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar comentario' });
            }
            return res.json({ message: 'Comentario eliminado' });
        });
    });
};

module.exports = {
    createComment,
    getPostComments,
    getNestedComments,
    deleteComment
};
