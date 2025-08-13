const db = require('./config/db');

async function test() {
  try {
    const [rows] = await db.query('SELECT 1');
    console.log('DB connection test success:', rows);
  } catch (err) {
    console.error('DB connection test failed:', err);
  }
  process.exit();
}

test();
