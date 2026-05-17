import mysql from 'mysql2/promise';

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  // Make unionId nullable
  try {
    await conn.execute(`ALTER TABLE users MODIFY COLUMN unionId VARCHAR(255) NULL`);
    console.log('Made unionId nullable');
  } catch (e) {
    console.log('unionId already nullable or error:', e.message);
  }

  // Add email unique if not exists
  try {
    await conn.execute(`ALTER TABLE users ADD UNIQUE INDEX email_idx (email)`);
    console.log('Added email unique index');
  } catch (e) {
    console.log('Email index already exists or error:', e.message);
  }

  // Add passwordHash column
  try {
    await conn.execute(`ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) NULL`);
    console.log('Added passwordHash column');
  } catch (e) {
    console.log('passwordHash already exists or error:', e.message);
  }

  await conn.end();
}

main().catch(console.error);
