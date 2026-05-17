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

  const [cols] = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'songs' AND COLUMN_NAME = 'detectedMood'`
  );

  if (cols.length === 0) {
    await conn.execute(`ALTER TABLE songs ADD COLUMN detectedMood VARCHAR(50)`);
    console.log('Added detectedMood column');
  } else {
    console.log('detectedMood column already exists');
  }

  await conn.end();
}

main().catch(console.error);
