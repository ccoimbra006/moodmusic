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
    connectTimeout: 10000,
  });

  console.log('Connected to database!');

  // Check users table columns
  const [cols] = await conn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION`
  );
  console.log('\nUsers table columns:');
  for (const col of cols) {
    console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY}`);
  }

  await conn.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
