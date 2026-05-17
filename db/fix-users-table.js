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
    multipleStatements: true,
  });

  console.log('Connected!');

  // Drop and recreate users table cleanly
  await conn.execute(`DROP TABLE IF EXISTS userActivity`);
  await conn.execute(`DROP TABLE IF EXISTS moodSelections`);
  await conn.execute(`DROP TABLE IF EXISTS commentReplies`);
  await conn.execute(`DROP TABLE IF EXISTS comments`);
  await conn.execute(`DROP TABLE IF EXISTS favorites`);
  await conn.execute(`DROP TABLE IF EXISTS likes`);
  await conn.execute(`DROP TABLE IF EXISTS songs`);
  await conn.execute(`DROP TABLE IF EXISTS users`);

  await conn.execute(`
    CREATE TABLE users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      unionId VARCHAR(255) NULL UNIQUE,
      email VARCHAR(320) NULL UNIQUE,
      passwordHash VARCHAR(255) NULL,
      name VARCHAR(255) NULL,
      avatar TEXT NULL,
      role ENUM('user','admin') NOT NULL DEFAULT 'user',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      lastSignInAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.execute(`
    CREATE TABLE songs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      spotifyId VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(255) NOT NULL,
      album VARCHAR(255) NULL,
      image TEXT NULL,
      spotifyUrl TEXT NULL,
      description TEXT NULL,
      detectedMood VARCHAR(50) NULL,
      date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      addedBy BIGINT UNSIGNED NULL,
      likesCount INT NULL DEFAULT 0,
      commentsCount INT NULL DEFAULT 0,
      CONSTRAINT songs_addedBy_fk FOREIGN KEY (addedBy) REFERENCES users(id)
    )
  `);

  await conn.execute(`
    CREATE TABLE likes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      songId BIGINT UNSIGNED NOT NULL,
      userId BIGINT UNSIGNED NOT NULL,
      type ENUM('like','dislike') NOT NULL DEFAULT 'like',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT likes_songId_fk FOREIGN KEY (songId) REFERENCES songs(id),
      CONSTRAINT likes_userId_fk FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  await conn.execute(`
    CREATE TABLE favorites (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      songId BIGINT UNSIGNED NOT NULL,
      userId BIGINT UNSIGNED NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fav_songId_fk FOREIGN KEY (songId) REFERENCES songs(id),
      CONSTRAINT fav_userId_fk FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  await conn.execute(`
    CREATE TABLE comments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      songId BIGINT UNSIGNED NOT NULL,
      userId BIGINT UNSIGNED NOT NULL,
      text TEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT cmt_songId_fk FOREIGN KEY (songId) REFERENCES songs(id),
      CONSTRAINT cmt_userId_fk FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  await conn.execute(`
    CREATE TABLE commentReplies (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      commentId BIGINT UNSIGNED NOT NULL,
      userId BIGINT UNSIGNED NOT NULL,
      text TEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT cr_commentId_fk FOREIGN KEY (commentId) REFERENCES comments(id),
      CONSTRAINT cr_userId_fk FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  await conn.execute(`
    CREATE TABLE moodSelections (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      userId BIGINT UNSIGNED NOT NULL,
      songId BIGINT UNSIGNED NOT NULL,
      mood VARCHAR(50) NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT ms_userId_fk FOREIGN KEY (userId) REFERENCES users(id),
      CONSTRAINT ms_songId_fk FOREIGN KEY (songId) REFERENCES songs(id)
    )
  `);

  await conn.execute(`
    CREATE TABLE userActivity (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      userId BIGINT UNSIGNED NOT NULL,
      songId BIGINT UNSIGNED NULL,
      action ENUM('listen','like','dislike','favorite','comment','reply','mood_change','share') NOT NULL,
      metadata JSON NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT ua_userId_fk FOREIGN KEY (userId) REFERENCES users(id),
      CONSTRAINT ua_songId_fk FOREIGN KEY (songId) REFERENCES songs(id)
    )
  `);

  console.log('All tables recreated successfully!');
  await conn.end();
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
