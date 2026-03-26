const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = async (req, res) => {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({
            error: 'Body inválido. Envía JSON con username, email y password y Content-Type: application/json.'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';

        db.execute(query, [username, email, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'El username o email ya existe.' });
                }
                return res.status(500).json({ error: 'Error al registrar usuario.' });
            }

            return res.status(201).json({ message: 'Usuario registrado con éxito' });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

const login = (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({
            error: 'Body inválido. Envía JSON con email y password y Content-Type: application/json.'
        });
    }

    const query = 'SELECT id, username, email, password_hash, score, streak, rank_id FROM users WHERE email = ?';
    db.execute(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en base de datos' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                score: user.score,
                streak: user.streak,
                rank_id: user.rank_id
            }
        });
    });
};

module.exports = {
    register,
    login
};
