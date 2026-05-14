const db = require('../config/db');

const POINTS_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50
};

const LEVEL_THRESHOLDS = [
  0,    // nivel 1
  100,  // nivel 2
  250,  // nivel 3
  450,  // nivel 4
  700,  // nivel 5
  1000, // nivel 6
  1350, // nivel 7
  1750, // nivel 8
  2200, // nivel 9
  2700  // nivel 10
];

const MAX_LEVEL = 10;

const calculateLevelFromPoints = (points) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

const calculateProgressToNextLevel = (points) => {
  const currentLevel = calculateLevelFromPoints(points);
  if (currentLevel >= MAX_LEVEL) return 100;

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.round(Math.min(100, Math.max(0, progress)));
};

// Crear objetivo
const createGoal = (req, res) => {
  const { title, description, difficulty, community_id } = req.body || {};
  const userId = req.user.id;

  if (!title || !difficulty || !community_id) {
    return res.status(400).json({
      error: 'Body inválido. Envía { title, description, difficulty, community_id }'
    });
  }

  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'Dificultad inválida. Usa: easy, medium o hard' });
  }

  const queryCommunity = 'SELECT 1 FROM communities WHERE id = ?';
  db.execute(queryCommunity, [community_id], (err, communityRows) => {
    if (err) {
      console.error('Error al validar comunidad:', err);
      return res.status(500).json({ error: 'Error interno al validar comunidad' });
    }

    if (!communityRows.length) {
      return res.status(400).json({ error: 'La comunidad indicada no existe' });
    }

    const query = `
      INSERT INTO goals (user_id, community_id, title, description, difficulty, status, completed_at)
      VALUES (?, ?, ?, ?, ?, 'pending', NULL)
    `;

    db.execute(query, [userId, community_id, title, description || null, difficulty], (err, result) => {
      if (err) {
        console.error('Error al crear objetivo:', {
          error: err,
          body: req.body,
          userId
        });
        return res.status(500).json({ error: err.message || 'Error al crear objetivo' });
      }
      return res.status(201).json({ message: 'Objetivo creado', goalId: result.insertId });
    });
  });
};

// Obtener objetivos del usuario (solo los de los últimos 7 días)
const getUserGoals = (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let query = `
    SELECT 
      g.id,
      g.title,
      g.description,
      g.difficulty,
      g.status,
      CASE g.difficulty
        WHEN 'easy' THEN ?
        WHEN 'medium' THEN ?
        WHEN 'hard' THEN ?
        ELSE 0
      END AS points,
      g.created_at,
      g.completed_at,
      c.id AS community_id,
      c.name AS community_name
    FROM goals g
    JOIN communities c ON c.id = g.community_id
    WHERE g.user_id = ?
      AND g.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `;

  const params = [
    POINTS_BY_DIFFICULTY.easy,
    POINTS_BY_DIFFICULTY.medium,
    POINTS_BY_DIFFICULTY.hard,
    userId
  ];

  if (status && ['pending', 'completed'].includes(status)) {
    query += ' AND g.status = ?';
    params.push(status);
  }

  query += ' ORDER BY g.created_at DESC';

  db.execute(query, params, (err, rows) => {
    if (err) {
      console.error('Error al cargar objetivos:', err);
      return res.status(500).json({ error: 'Error al cargar objetivos' });
    }
    return res.json(rows);
  });
};

// Obtener objetivo específico
const getGoalById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = `
    SELECT 
      g.id,
      g.title,
      g.description,
      g.difficulty,
      g.status,
      CASE g.difficulty
        WHEN 'easy' THEN ?
        WHEN 'medium' THEN ?
        WHEN 'hard' THEN ?
        ELSE 0
      END AS points,
      g.created_at,
      g.completed_at,
      c.id AS community_id,
      c.name AS community_name
    FROM goals g
    JOIN communities c ON c.id = g.community_id
    WHERE g.id = ? AND g.user_id = ?
  `;

  db.execute(query, [
    POINTS_BY_DIFFICULTY.easy,
    POINTS_BY_DIFFICULTY.medium,
    POINTS_BY_DIFFICULTY.hard,
    id,
    userId
  ], (err, rows) => {
    if (err) {
      console.error('Error al obtener objetivo por id:', err);
      return res.status(500).json({ error: 'Error al cargar objetivo' });
    }
    if (!rows.length) return res.status(404).json({ error: 'Objetivo no encontrado' });
    return res.json(rows[0]);
  });
};

// Actualizar objetivo (solo si está pending)
const updateGoal = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, description, difficulty } = req.body || {};

  if (!title && !description && !difficulty) {
    return res.status(400).json({ error: 'Envía al menos un campo a actualizar' });
  }

  const updates = [];
  const params = [];

  if (title) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (difficulty) {
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Dificultad inválida. Usa: easy, medium o hard' });
    }
    updates.push('difficulty = ?'); params.push(difficulty);
  }

  const query = `UPDATE goals SET ${updates.join(', ')} WHERE id = ? AND user_id = ? AND status = 'pending'`;
  params.push(id, userId);

  db.execute(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar objetivo' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Objetivo no encontrado o ya completado' });
    return res.json({ message: 'Objetivo actualizado' });
  });
};

// Completar objetivo → suma puntos
const completeGoal = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Solo se puede completar si tiene menos de 7 días
  const getGoalQuery = `
    SELECT difficulty FROM goals 
    WHERE id = ? AND user_id = ? AND status = 'pending'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `;

  db.execute(getGoalQuery, [id, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al completar objetivo' });
    if (!rows.length) return res.status(404).json({ error: 'Objetivo no encontrado, ya completado o expirado' });

    const points = POINTS_BY_DIFFICULTY[rows[0].difficulty] || 0;

    const updateGoalQuery = `
      UPDATE goals
      SET status = 'completed', completed_at = NOW()
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `;

    db.execute(updateGoalQuery, [id, userId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al completar objetivo' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Objetivo no encontrado o ya completado' });
      }

      const updateUserQuery = `UPDATE users SET score = score + ? WHERE id = ?`;
      db.execute(updateUserQuery, [points, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar puntos' });

        const getUserQuery = `SELECT score FROM users WHERE id = ?`;
        db.execute(getUserQuery, [userId], (err, userRows) => {
          if (err || !userRows.length) return res.json({ message: 'Objetivo completado', points });

          const totalPoints = userRows[0].score;
          const newLevel = calculateLevelFromPoints(totalPoints);
          const progress = calculateProgressToNextLevel(totalPoints);

          return res.json({ message: 'Objetivo completado', points, newLevel, progress, totalPoints });
        });
      });
    });
  });
};

// Eliminar objetivo
const deleteGoal = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = 'DELETE FROM goals WHERE id = ? AND user_id = ?';
  db.execute(query, [id, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar objetivo' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Objetivo no encontrado' });
    return res.json({ message: 'Objetivo eliminado' });
  });
};

// Nivel y progreso del usuario
const getUserLevelProgress = (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT score FROM users WHERE id = ?';
  db.execute(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar nivel' });
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const totalPoints = rows[0].score || 0;
    const currentLevel = calculateLevelFromPoints(totalPoints);
    const progress = calculateProgressToNextLevel(totalPoints);
    const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
    const nextThreshold = currentLevel < MAX_LEVEL ? LEVEL_THRESHOLDS[currentLevel] : LEVEL_THRESHOLDS[MAX_LEVEL - 1];

    return res.json({
      totalPoints,
      currentLevel,
      progress,
      maxLevel: MAX_LEVEL,
      pointsInLevel: totalPoints - currentThreshold,
      pointsNeededForNextLevel: nextThreshold - currentThreshold,
      nextLevelAt: nextThreshold
    });
  });
};

module.exports = {
  createGoal,
  getUserGoals,
  getGoalById,
  updateGoal,
  completeGoal,
  deleteGoal,
  getUserLevelProgress,
  calculateLevelFromPoints,
  calculateProgressToNextLevel,
  POINTS_BY_DIFFICULTY,
  LEVEL_THRESHOLDS,
  MAX_LEVEL
};