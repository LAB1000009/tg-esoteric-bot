const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS specialists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
  
      name TEXT,
      type TEXT,
      emoji TEXT,
      price TEXT,
      experience TEXT,
      description TEXT,
      telegram TEXT,
      rating TEXT,
      country TEXT,
  
      online INTEGER,
      vip INTEGER,
  
      clients INTEGER,
      response TEXT,
  
      photo TEXT,
  
      status TEXT,
      owner_id TEXT,
      views INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      specialist_id INTEGER,
      user_name TEXT,
      text TEXT,
      stars INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
  
      specialist_id INTEGER,
      user_name TEXT,
      text TEXT,
      stars INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vip_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
  
      specialist_id INTEGER,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
  
      user_id TEXT,
      specialist_id INTEGER
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS profile_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    specialist_id INTEGER,
    viewer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

});

module.exports = db;