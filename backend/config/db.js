const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const caPathFromEnv = process.env.DB_SSL_CA_PATH;
const resolvedCaPath = caPathFromEnv
    ? (path.isAbsolute(caPathFromEnv)
        ? caPathFromEnv
        : path.resolve(__dirname, '..', '..', caPathFromEnv))
    : null;

const sslConfig = resolvedCaPath && fs.existsSync(resolvedCaPath)
    ? { ca: fs.readFileSync(resolvedCaPath, 'utf8') }
    : undefined;

if (!sslConfig) {
    console.warn('Aviso: no se encontró el certificado definido en DB_SSL_CA_PATH, conexión sin CA explícita.');
}

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    ssl: sslConfig
});

db.on('error', (err) => {
    console.error('Error de MySQL:', err.message);
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log('Conexión a MySQL establecida');
});

module.exports = db;
