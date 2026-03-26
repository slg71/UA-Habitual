const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(403).json({ error: 'No se proporcionó un token' });
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Formato de token inválido. Usa: Bearer <token>' });
    }

    return jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = decoded;
        return next();
    });
};

module.exports = verifyToken;
