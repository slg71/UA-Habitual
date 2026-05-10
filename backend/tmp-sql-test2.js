require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const db = require('./config/db');

db.execute("INSERT INTO goals (user_id, community_id, title, description, difficulty, status) VALUES (360001, 12, 'Prueba SQL2', NULL, 'easy', 'pending')", (err, rows) => {
  if (err) {
    console.error(JSON.stringify({
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      errno: err.errno,
      sqlState: err.sqlState,
      sql: err.sql
    }, null, 2));
    process.exit(1);
  }
  console.log('OK');
  process.exit(0);
});
