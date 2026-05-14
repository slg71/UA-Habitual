require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const db = require('./config/db');
const userId = 360001;
const community_id = 12;
const title = 'Prueba SQL';
const description = null;
const difficulty = 'easy';
const points = 10;
const query = `INSERT INTO goals (user_id, community_id, title, description, difficulty, status) VALUES (?, ?, ?, ?, ?, 'pending')`;

db.execute(query, [userId, community_id, title, description, difficulty], (err, result) => {
  if (err) {
    console.error(JSON.stringify({
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState,
      errno: err.errno,
      sql: err.sql
    }, null, 2));
    process.exit(1);
  }
  console.log('OK', result.insertId);
  process.exit(0);
});
