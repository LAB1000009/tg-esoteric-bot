const db = require("./database");

db.run("DELETE FROM specialists");

const specialists = [

  {
    name: "Аврора Таро",
    type: "tarot",
    emoji: "🔮",
    price: "1500₽",
    experience: "5 лет",
    description: "Расклады на любовь, отношения и жизненные ситуации.",
    telegram: "aurora_tarot",
    rating: "4.9",
    country: "Таиланд",
    online: 1,
    vip: 1,
    clients: 214,
    response: "5 минут",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800"
  },

  {
    name: "Луна Астролог",
    type: "astrology",
    emoji: "⭐",
    price: "2500₽",
    experience: "8 лет",
    description: "Натальные карты и совместимость.",
    telegram: "luna_astrology",
    rating: "4.8",
    country: "Польша",
    online: 1,
    vip: 0,
    clients: 173,
    response: "10 минут",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800"
  },

  {
    name: "Мастер Рун",
    type: "runes",
    emoji: "🪬",
    price: "1800₽",
    experience: "4 года",
    description: "Рунические практики и энергетические чистки.",
    telegram: "rune_master",
    rating: "4.7",
    country: "США",
    online: 0,
    vip: 0,
    clients: 98,
    response: "15 минут",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800"
  },

  {
    name: "Энергия Света",
    type: "energy",
    emoji: "🧘",
    price: "3000₽",
    experience: "10 лет",
    description: "Чистка энергетики и медитации.",
    telegram: "energy_light",
    rating: "5.0",
    country: "Таиланд",
    online: 1,
    vip: 0,
    clients: 312,
    response: "3 минуты",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800"
  },

  {
    name: "София Таро",
    type: "tarot",
    emoji: "🔮",
    price: "2200₽",
    experience: "7 лет",
    description: "Кармические расклады и анализ отношений.",
    telegram: "sofia_tarot",
    rating: "4.9",
    country: "Германия",
    online: 1,
    vip: 0,
    clients: 189,
    response: "7 минут",
    photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=800"
  },

  {
    name: "Космо Астролог",
    type: "astrology",
    emoji: "⭐",
    price: "2800₽",
    experience: "12 лет",
    description: "Полный астрологический разбор личности.",
    telegram: "cosmo_astrology",
    rating: "5.0",
    country: "Франция",
    online: 1,
    vip: 0,
    clients: 401,
    response: "2 минуты",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800"
  },

  {
    name: "Норд Руны",
    type: "runes",
    emoji: "🪬",
    price: "1900₽",
    experience: "6 лет",
    description: "Скандинавские руны и защитные практики.",
    telegram: "nord_runes",
    rating: "4.6",
    country: "Норвегия",
    online: 0,
    vip: 0,
    clients: 120,
    response: "20 минут",
    photo: "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=800"
  },

  {
    name: "Медитация Души",
    type: "energy",
    emoji: "🧘",
    price: "3500₽",
    experience: "11 лет",
    description: "Энергетические практики и работа с тревожностью.",
    telegram: "soul_energy",
    rating: "4.9",
    country: "Бали",
    online: 1,
    vip: 0,
    clients: 267,
    response: "4 минуты",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800"
  },

  {
    name: "Тень Судьбы",
    type: "tarot",
    emoji: "🔮",
    price: "5000₽",
    experience: "15 лет",
    description: "Глубокие расклады на судьбу и предназначение.",
    telegram: "shadow_destiny",
    rating: "5.0",
    country: "Россия",
    online: 1,
    vip: 0,
    clients: 589,
    response: "1 минута",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800"
  },

  {
    name: "Астра Нумеролог",
    type: "astrology",
    emoji: "⭐",
    price: "2400₽",
    experience: "9 лет",
    description: "Нумерология и прогнозы жизненных циклов.",
    telegram: "astra_numbers",
    rating: "4.8",
    country: "Испания",
    online: 1,
    vip: 0,
    clients: 144,
    response: "8 минут",
    photo: "https://images.unsplash.com/photo-1491349174775-aaafddd81942?q=80&w=800"
  },

  {
    name: "Энергия Луны",
    type: "energy",
    emoji: "🧘",
    price: "4200₽",
    experience: "13 лет",
    description: "Восстановление энергетики и духовные практики.",
    telegram: "moon_energy",
    rating: "5.0",
    country: "Индия",
    online: 1,
    vip: 0,
    clients: 490,
    response: "2 минуты",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800"
  }

];

specialists.forEach((s) => {

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
    s.telegram,
    s.rating,
    s.country,
    s.online,
    s.vip,
    s.clients,
    s.response,
    s.photo,
    "approved",
    "seed",
    0
  ]); 

});

const reviews = [

    {
      specialist_id: 1,
      user_name: "Марина",
      text: "Очень сильный расклад. Все совпало.",
      stars: 5
    },
  
    {
      specialist_id: 1,
      user_name: "Александр",
      text: "Ответили быстро и без воды.",
      stars: 5
    },
  
    {
      specialist_id: 2,
      user_name: "Елена",
      text: "Подробно разобрали натальную карту.",
      stars: 5
    },
  
    {
      specialist_id: 3,
      user_name: "Игорь",
      text: "Интересная руническая практика.",
      stars: 4
    },
  
    {
      specialist_id: 4,
      user_name: "София",
      text: "Очень приятная энергетика.",
      stars: 5
    }
  
  ];
  
  db.run("DELETE FROM reviews");
  
  reviews.forEach((r) => {
  
    db.run(`
      INSERT INTO reviews (
        specialist_id,
        user_name,
        text,
        stars
      )
      VALUES (?, ?, ?, ?)
    `, [
      r.specialist_id,
      r.user_name,
      r.text,
      r.stars
    ]);
  
  });

console.log("✅ База заполнена");