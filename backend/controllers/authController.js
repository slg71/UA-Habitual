const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
        return res.status(400).json({
            error: 'Body inválido. Envía JSON con name, email y password y Content-Type: application/json.'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

        db.execute(query, [name, email, hashedPassword], (err) => {
            if (err) {
                return res.status(400).json({ error: 'El email ya existe.' });
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

    const query = 'SELECT * FROM users WHERE email = ?';
    db.execute(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({ message: 'Login exitoso', token });
    });
};

module.exports = {
    register,
    login
};
