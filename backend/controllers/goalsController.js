const db = require('../config/db');

const createGoal = (req, res) => {
    const { title, description, difficulty, community_id } = req.body || {};
    const userId = req.user.id;

    if (!title || !difficulty || !community_id) {
        return res.status(400).json({
            error: 'Body inválido. Envía { title, description, difficulty, community_id }'
        });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({
            error: 'Dificultad inválida. Usa: easy, medium o hard'
        });
    }

    const query = `
        INSERT INTO goals (user_id, community_id, title, description, difficulty, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    db.execute(query, [userId, community_id, title, description || null, difficulty], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al crear goal' });
        }
        return res.status(201).json({
            message: 'Goal creado',
            goalId: result.insertId
        });
    });
};

const getUserGoals = (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
        SELECT 
            g.id, g.title, g.description, g.difficulty, g.status, g.created_at, g.completed_at,
            c.id as community_id, c.name as community_name
        FROM goals g
        JOIN communities c ON c.id = g.community_id
        WHERE g.user_id = ?
    `;

    const params = [userId];

    if (status && ['pending', 'completed'].includes(status)) {
        query += ' AND g.status = ?';
        params.push(status);
    }

    query += ' ORDER BY g.created_at DESC';

    db.execute(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar goals' });
        }
        return res.json(rows);
    });
};

const getGoalById = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
        SELECT 
            g.id, g.title, g.description, g.difficulty, g.status, g.created_at, g.completed_at,
            c.id as community_id, c.name as community_name
        FROM goals g
        JOIN communities c ON c.id = g.community_id
        WHERE g.id = ? AND g.user_id = ?
    `;

    db.execute(query, [id, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar goal' });
        }
        if (!rows.length) {
            return res.status(404).json({ error: 'Goal no encontrado' });
        }
        return res.json(rows[0]);
    });
};

const updateGoal = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, difficulty } = req.body || {};

    if (!title && !description && !difficulty) {
        return res.status(400).json({
            error: 'Envía al menos un campo a actualizar'
        });
    }

    let query = 'UPDATE goals SET ';
    const updates = [];
    const params = [];

    if (title) {
        updates.push('title = ?');
        params.push(title);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
    }
    if (difficulty) {
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({
                error: 'Dificultad inválida. Usa: easy, medium o hard'
            });
        }
        updates.push('difficulty = ?');
        params.push(difficulty);
    }

    query += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
    params.push(id, userId);

    db.execute(query, params, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar goal' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Goal no encontrado' });
        }
        return res.json({ message: 'Goal actualizado' });
    });
};

const completeGoal = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
        UPDATE goals 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND status = 'pending'
    `;

    db.execute(query, [id, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al completar goal' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Goal no encontrado o ya completado' });
        }
        return res.json({ message: 'Goal completado' });
    });
};

const deleteGoal = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const query = 'DELETE FROM goals WHERE id = ? AND user_id = ?';
    db.execute(query, [id, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar goal' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Goal no encontrado' });
        }
        return res.json({ message: 'Goal eliminado' });
    });
};

module.exports = {
    createGoal,
    getUserGoals,
    getGoalById,
    updateGoal,
    completeGoal,
    deleteGoal
};
