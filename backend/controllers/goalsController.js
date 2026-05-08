const db = require('../config/db');

// Configuración de puntos por dificultad
const POINTS_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50
};

// Configuración de niveles (máximo 10)
const LEVEL_CONFIG = {
  1: 100,    // Nivel 1 requiere 100 puntos
  2: 200,    // Nivel 2 requiere 200 puntos totales (100 más)
  3: 350,    // Nivel 3 requiere 350 puntos totales (150 más)
  4: 550,    // Nivel 4 requiere 550 puntos totales (200 más)
  5: 800,    // Nivel 5 requiere 800 puntos totales (250 más)
  6: 1100,   // Nivel 6 requiere 1100 puntos totales (300 más)
  7: 1450,   // Nivel 7 requiere 1450 puntos totales (350 más)
  8: 1850,   // Nivel 8 requiere 1850 puntos totales (400 más)
  9: 2300,   // Nivel 9 requiere 2300 puntos totales (450 más)
  10: 2800   // Nivel 10 requiere 2800 puntos totales (500 más) - Máximo
};

const MAX_LEVEL = 10;

// Calcula el nivel actual basado en puntos totales
const calculateLevelFromPoints = (totalPoints) => {
  let currentLevel = 1;
  for (let level = MAX_LEVEL; level >= 1; level--) {
    if (totalPoints >= LEVEL_CONFIG[level]) {
      currentLevel = level;
      break;
    }
  }
  return Math.min(currentLevel, MAX_LEVEL);
};

// Calcula el progreso actual hacia el siguiente nivel (0-100%)
const calculateProgressToNextLevel = (totalPoints) => {
  const currentLevel = calculateLevelFromPoints(totalPoints);
  if (currentLevel >= MAX_LEVEL) return 100; // Nivel máximo alcanzado

  const pointsForCurrentLevel = LEVEL_CONFIG[currentLevel];
  const pointsForNextLevel = LEVEL_CONFIG[currentLevel + 1];
  const pointsNeededForNext = pointsForNextLevel - pointsForCurrentLevel;
  const pointsIntoLevel = totalPoints - pointsForCurrentLevel;

  const progress = Math.min(100, Math.max(0, (pointsIntoLevel / pointsNeededForNext) * 100));
  return Math.round(progress);
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
    return res.status(400).json({
      error: 'Dificultad inválida. Usa: easy, medium o hard'
    });
  }

  const points = POINTS_BY_DIFFICULTY[difficulty];

  const query = `
    INSERT INTO goals (user_id, community_id, title, description, difficulty, points, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))
  `;

  db.execute(query, [userId, community_id, title, description || null, difficulty, points], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al crear objetivo' });
    }
    return res.status(201).json({
      message: 'Objetivo creado',
      goalId: result.insertId
    });
  });
};

// Obtener objetivos del usuario
const getUserGoals = (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  // Primero limpiar objetivos expirados
  const deleteExpiredQuery = `
    DELETE FROM goals 
    WHERE user_id = ? AND status = 'pending' AND expires_at < NOW()
  `;

  db.execute(deleteExpiredQuery, [userId], (err) => {
    if (err) {
      console.error('Error limpiando objetivos expirados:', err);
    }

    let query = `
      SELECT 
        g.id, g.title, g.description, g.difficulty, g.status, g.points, g.created_at, g.completed_at, g.expires_at,
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
        return res.status(500).json({ error: 'Error al cargar objetivos' });
      }
      return res.json(rows);
    });
  });
};

// Obtener un objetivo específico
const getGoalById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = `
    SELECT 
      g.id, g.title, g.description, g.difficulty, g.status, g.points, g.created_at, g.completed_at, g.expires_at,
      c.id as community_id, c.name as community_name
    FROM goals g
    JOIN communities c ON c.id = g.community_id
    WHERE g.id = ? AND g.user_id = ?
  `;

  db.execute(query, [id, userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cargar objetivo' });
    }
    if (!rows.length) {
      return res.status(404).json({ error: 'Objetivo no encontrado' });
    }
    return res.json(rows[0]);
  });
};

// Actualizar objetivo
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
    updates.push('points = ?');
    params.push(POINTS_BY_DIFFICULTY[difficulty]);
  }

  query += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
  params.push(id, userId);

  db.execute(query, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar objetivo' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Objetivo no encontrado' });
    }
    return res.json({ message: 'Objetivo actualizado' });
  });
};

// Completar objetivo (con puntos)
const completeGoal = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Obtener objetivo
  const getGoalQuery = `
    SELECT points FROM goals 
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `;

  db.execute(getGoalQuery, [id, userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al completar objetivo' });
    }
    if (!rows.length) {
      return res.status(404).json({ error: 'Objetivo no encontrado o ya completado' });
    }

    const points = rows[0].points;

    // Actualizar objetivo a completado
    const updateGoalQuery = `
      UPDATE goals 
      SET status = 'completed', completed_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    db.execute(updateGoalQuery, [id, userId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al completar objetivo' });
      }

      // Actualizar puntos del usuario
      const updateUserQuery = `
        UPDATE users 
        SET score = score + ?
        WHERE id = ?
      `;

      db.execute(updateUserQuery, [points, userId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar puntos' });
        }

        // Obtener nuevo nivel
        const getUserQuery = `SELECT score FROM users WHERE id = ?`;
        db.execute(getUserQuery, [userId], (err, userRows) => {
          if (err || !userRows.length) {
            return res.json({ message: 'Objetivo completado', points });
          }

          const totalPoints = userRows[0].score;
          const newLevel = calculateLevelFromPoints(totalPoints);
          const progress = calculateProgressToNextLevel(totalPoints);

          return res.json({ 
            message: 'Objetivo completado',
            points,
            newLevel,
            progress,
            totalPoints
          });
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
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar objetivo' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Objetivo no encontrado' });
    }
    return res.json({ message: 'Objetivo eliminado' });
  });
};

// Obtener información de nivel y progreso del usuario
const getUserLevelProgress = (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT score FROM users WHERE id = ?';
  db.execute(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cargar información de nivel' });
    }
    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const totalPoints = rows[0].score || 0;
    const currentLevel = calculateLevelFromPoints(totalPoints);
    const progress = calculateProgressToNextLevel(totalPoints);
    const nextLevelPoints = currentLevel < MAX_LEVEL ? LEVEL_CONFIG[currentLevel + 1] : LEVEL_CONFIG[MAX_LEVEL];
    const currentLevelPoints = LEVEL_CONFIG[currentLevel];
    const pointsInLevel = totalPoints - currentLevelPoints;
    const pointsNeededForNextLevel = nextLevelPoints - currentLevelPoints;

    return res.json({
      totalPoints,
      currentLevel,
      progress,
      maxLevel: MAX_LEVEL,
      pointsInLevel,
      pointsNeededForNextLevel,
      nextLevelPoints
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
  LEVEL_CONFIG,
  MAX_LEVEL
};
