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

      const specialists = [

        // ❤️ ОТНОШЕНИЯ

       // ❤️ ОТНОШЕНИЯ

{
  name: "Анна",
  type: "relationships",
  emoji: "❤️",
  price: "50$",
  experience: "7 лет",
  description: "Помогаю восстановить отношения и внутренний баланс.",
  country: "Польша",
  clients: 320,
  vip: 1,
  photo: "https://randomuser.me/api/portraits/women/44.jpg"
},

{
  name: "Мария",
  type: "relationships",
  emoji: "❤️",
  price: "40$",
  experience: "5 лет",
  description: "Работаю с семейными конфликтами и эмоциональной близостью.",
  country: "Украина",
  clients: 180,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/women/68.jpg"
},

{
  name: "Елена",
  type: "relationships",
  emoji: "❤️",
  price: "65$",
  experience: "10 лет",
  description: "Помогаю выйти из тяжелых отношений и вернуть уверенность.",
  country: "Германия",
  clients: 450,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/women/65.jpg"
},

// 💰 ФИНАНСЫ

{
  name: "Максим",
  type: "finance",
  emoji: "💰",
  price: "70$",
  experience: "10 лет",
  description: "Работаю с финансовыми блоками и реализацией.",
  country: "Украина",
  clients: 540,
  vip: 1,
  photo: "https://randomuser.me/api/portraits/men/32.jpg"
},

{
  name: "Игорь",
  type: "finance",
  emoji: "💰",
  price: "45$",
  experience: "6 лет",
  description: "Помогаю найти свое направление и повысить доход.",
  country: "Польша",
  clients: 210,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/men/41.jpg"
},

{
  name: "Олег",
  type: "finance",
  emoji: "💰",
  price: "90$",
  experience: "12 лет",
  description: "Глубинная работа с ограничениями в бизнесе и деньгах.",
  country: "Латвия",
  clients: 700,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/men/53.jpg"
},

// 🩺 ЗДОРОВЬЕ

{
  name: "София",
  type: "health",
  emoji: "🩺",
  price: "65$",
  experience: "8 лет",
  description: "Работаю с психосоматикой и внутренними состояниями.",
  country: "Таиланд",
  clients: 410,
  vip: 1,
  photo: "https://randomuser.me/api/portraits/women/50.jpg"
},

{
  name: "Наталья",
  type: "health",
  emoji: "🩺",
  price: "55$",
  experience: "5 лет",
  description: "Помогаю восстановить ресурсное состояние и энергию.",
  country: "Польша",
  clients: 190,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/women/22.jpg"
},

{
  name: "Дмитрий",
  type: "health",
  emoji: "🩺",
  price: "95$",
  experience: "15 лет",
  description: "Комплексная работа с телом и эмоциональным напряжением.",
  country: "Германия",
  clients: 760,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/men/76.jpg"
},

// 👶 ДЕТИ И СЕМЬЯ

{
  name: "Ольга",
  type: "family",
  emoji: "👶",
  price: "50$",
  experience: "7 лет",
  description: "Работаю с детско-родительскими отношениями.",
  country: "Украина",
  clients: 340,
  vip: 1,
  photo: "https://randomuser.me/api/portraits/women/33.jpg"
},

{
  name: "Татьяна",
  type: "family",
  emoji: "👶",
  price: "45$",
  experience: "4 года",
  description: "Помогаю восстановить гармонию внутри семьи.",
  country: "Польша",
  clients: 170,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/women/29.jpg"
},

{
  name: "Юлия",
  type: "family",
  emoji: "👶",
  price: "70$",
  experience: "11 лет",
  description: "Глубинная работа с эмоциональной связью родителей и детей.",
  country: "Литва",
  clients: 430,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/women/72.jpg"
},

// 🌌 МНОГОПРОФИЛЬНЫЕ

{
  name: "Александр",
  type: "universal",
  emoji: "🌌",
  price: "100$",
  experience: "15 лет",
  description: "Многопрофильная практика и работа с состояниями.",
  country: "Таиланд",
  clients: 910,
  vip: 1,
  photo: "https://randomuser.me/api/portraits/men/11.jpg"
},

{
  name: "Виктория",
  type: "universal",
  emoji: "🌌",
  price: "70$",
  experience: "8 лет",
  description: "Комплексная работа с жизненными запросами.",
  country: "Польша",
  clients: 360,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/women/90.jpg"
},

{
  name: "Роман",
  type: "universal",
  emoji: "🌌",
  price: "85$",
  experience: "11 лет",
  description: "Работаю с состояниями, реализацией и внутренними блоками.",
  country: "Германия",
  clients: 530,
  vip: 0,
  photo: "https://randomuser.me/api/portraits/men/61.jpg"
}

      ];

      specialists.forEach((s, index) => {

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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          s.name,
          s.type,
          s.emoji,
          s.price,
          s.experience,
          s.description,
          "username",
          "5",
          s.country,
          1,
          s.vip,
          s.clients,
          "5 минут",
          s.photo,
          "approved",
          String(index + 1),
          0
        ]);

      });

      console.log("✅ Mock specialists created");

    }

  }
);

  // db.run(`
  //   CREATE TABLE IF NOT EXISTS reviews (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,

  //     specialist_id INTEGER,
  //     user_name TEXT,
  //     text TEXT,
  //     stars INTEGER
  //   )
  // `);

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