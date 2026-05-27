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

db.get(
  `
  SELECT COUNT(*) as count
  FROM specialists
  `,
  (err, row) => {

    if (row.count === 0) {

      db.run(`
        INSERT INTO specialists (
          name,
          type,
          emoji,
          price,
          experience,
          description,
          telegram,
          rating,
          country,
          online,
          vip,
          clients,
          response,
          photo,
          status,
          owner_id,
          views
        )
        VALUES (
          'Tarot Master',
          'tarot',
          '🔮',
          '25$',
          '5 лет',
          'Опытный таролог и консультант',
          'username',
          '5',
          'Польша',
          1,
          1,
          120,
          '5 минут',
          'https://images.unsplash.com/photo-1494790108377-be9c29b293f?q=80&w=800',
          'approved',
          '1',
          0
        )
      `);

      db.run(`
        INSERT INTO specialists (
          name,
          type,
          emoji,
          price,
          experience,
          description,
          telegram,
          rating,
          country,
          online,
          vip,
          clients,
          response,
          photo,
          status,
          owner_id,
          views
        )
        VALUES (
          'Astro Luna',
          'astrology',
          '⭐',
          '40$',
          '8 лет',
          'Астролог и натальная карта',
          'username',
          '5',
          'Украина',
          1,
          0,
          340,
          '10 минут',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800',
          'approved',
          '2',
          0
        )
      `);

      db.run(`
        INSERT INTO specialists (
          name,
          type,
          emoji,
          price,
          experience,
          description,
          telegram,
          rating,
          country,
          online,
          vip,
          clients,
          response,
          photo,
          status,
          owner_id,
          views
        )
        VALUES (
          'Energy Healer',
          'energy',
          '🧘',
          '30$',
          '6 лет',
          'Энергопрактик и медитации',
          'username',
          '5',
          'Таиланд',
          1,
          1,
          210,
          '15 минут',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800',
          'approved',
          '3',
          0
        )
      `);

      console.log("✅ Mock specialists created");

    }

  }
);

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