const db = require('../config/db');

const getAllCommunities = (req, res) => {
    const query = 'SELECT * FROM communities ORDER BY name';

    db.execute(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar comunidades' });
        }
        return res.json(rows);
    });
};

const getCommunityById = (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM communities WHERE id = ?';

    db.execute(query, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar comunidad' });
        }
        if (!rows.length) {
            return res.status(404).json({ error: 'Comunidad no encontrada' });
        }
        return res.json(rows[0]);
    });
};

const getCommunityMembers = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT u.id, u.username, u.email, u.score, u.streak, uc.joined_at
        FROM user_communities uc
        JOIN users u ON u.id = uc.user_id
        WHERE uc.community_id = ?
        ORDER BY u.score DESC
    `;

    db.execute(query, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar miembros' });
        }
        return res.json(rows);
    });
};

const createCommunity = (req, res) => {
    // Nota: Agregar validación de rol admin en verifyToken si es necesario
    const { name, description, category } = req.body || {};

    if (!name || !category) {
        return res.status(400).json({
            error: 'Body inválido. Envía { name, description, category }'
        });
    }

    const query = 'INSERT INTO communities (name, description, category) VALUES (?, ?, ?)';
    db.execute(query, [name, description || null, category], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El nombre de la comunidad ya existe' });
            }
            return res.status(500).json({ error: 'Error al crear comunidad' });
        }
        return res.status(201).json({ message: 'Comunidad creada con éxito' });
    });
};

const joinCommunity = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const query = 'INSERT INTO user_communities (user_id, community_id) VALUES (?, ?)';
    db.execute(query, [userId, id], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Ya estás unido a esta comunidad' });
            }
            return res.status(500).json({ error: 'Error al unirse a la comunidad' });
        }
        return res.status(201).json({ message: 'Te uniste a la comunidad' });
    });
};

const leaveCommunity = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const query = 'DELETE FROM user_communities WHERE user_id = ? AND community_id = ?';
    db.execute(query, [userId, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al salir de la comunidad' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No estabas unido a esta comunidad' });
        }
        return res.json({ message: 'Saliste de la comunidad' });
    });
};

const getUserCommunities = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT c.*, uc.joined_at
        FROM user_communities uc
        JOIN communities c ON c.id = uc.community_id
        WHERE uc.user_id = ?
        ORDER BY c.name
    `;

    db.execute(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar comunidades' });
        }
        return res.json(rows);
    });
};

module.exports = {
    getAllCommunities,
    getCommunityById,
    getCommunityMembers,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    getUserCommunities
};
