require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const OpenAI = require("openai");
const db = require("./database");
const path = require("path");
const bot = new Telegraf(process.env.BOT_TOKEN);

let openai = null;

if (process.env.OPENAI_API_KEY) {

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

}

const registrationState = {};
const userReviewState = {};
const aiMatchState = {};
const editState = {};

function menu() {
 return Markup.inlineKeyboard([

  [
    Markup.button.callback(
      "🏠 Главное меню",
      "home"
    )
  ],

  [
    Markup.button.callback(
      "🤖 AI Подбор специалиста",
      "ai_match"
    )
  ],

  [
    Markup.button.callback(
      "❤️ Отношения",
      "relationships"
    ),
    Markup.button.callback(
      "💰 Финансы",
      "finance"
    )
  ],

  [
    Markup.button.callback(
      "🩺 Здоровье",
      "health"
    ),
    Markup.button.callback(
      "👶 Дети и семья",
      "family"
    )
  ],

  [
    Markup.button.callback(
      "🌌 Многопрофильные",
      "universal"
    )
  ],

  [
    Markup.button.callback(
      "🚀 Продвигаемые практики",
      "vip"
    )
  ],

  [
    Markup.button.callback(
      " ",
      "empty"
    )
  ],

  [
    Markup.button.callback(
      "📂 Избранное",
      "favorites"
    ),
    Markup.button.callback(
      "👤 Мой профиль",
      "my_profile"
    )
  ],

  [
    Markup.button.callback(
      "🎓 Стать практиком",
      "register"
    )
  ],

  [
    Markup.button.callback(
      "🛡 Безопасность",
      "safe"
    )
  ]

]);
}

bot.start(async (ctx) => {

  await ctx.replyWithPhoto(
    {
      source: path.join(__dirname, "assets", "menu.png")
    },
    {
      caption:
`🔮 Остеопатия Души Мастера

Платформа практиков школы «Остеопатия Души».

✅ Ручная модерация анкет
✅ Проверенные отзывы
✅ Только активные эксперты
✅ Защита от фейков и мошенников

Найдите своего специалиста:

• Отношения
• Финансы и реализация
• Здоровье и тело
• Дети и семья
• Многопрофильный практик

👇 Выберите категорию`,
      ...menu()
    }
  );

});

function showExperts(ctx, type) {

  db.all(
    `
    SELECT
      specialists.*,
      ROUND(AVG(reviews.stars), 1) as avg_rating
    FROM specialists
    LEFT JOIN reviews
    ON specialists.id = reviews.specialist_id
    WHERE specialists.type = ?
    AND specialists.status = 'approved'
    GROUP BY specialists.id
    ORDER BY specialists.vip DESC, specialists.id DESC
    `,
    [type],
    (err, list) => {

      if (err) {
        console.log(err);
        return ctx.reply("Ошибка базы данных");
      }

      if (!list.length) {
        return ctx.reply("Специалисты не найдены");
      }

      list.forEach((s) => {

        db.run(
          `
          INSERT INTO profile_views (
            specialist_id,
            viewer_id
          )
          VALUES (?, ?)
          `,
          [
            s.id,
            ctx.from.id
          ]
        );

        db.run(
        `
        UPDATE specialists
        SET views = views + 1
        WHERE id = ?
        `,
        [s.id]
      );

        const buttons = [
          [
            Markup.button.url(
              "📩 Написать",
              `https://t.me/${s.telegram}`
            )
          ],
          [
            Markup.button.callback(
              "📖 Смотреть отзывы",
              `reviews_${s.id}`
            )
          ],
          [
            Markup.button.callback(
              "⭐ Оставить отзыв",
              `leave_review_${s.id}`
            )
          ],
          [
            Markup.button.callback(
              "❤️ В избранное",
              `fav_${s.id}`
            )
          ]
        ];

        if (String(ctx.from.id) === String(s.owner_id)) {

          buttons.push([
            Markup.button.callback(
              "🚀 Продвижение анкеты",
              `buy_vip_${s.id}`
            )
          ]);

        }

        const online = s.online
          ? "🟢 Сейчас онлайн"
          : "⚫ Не в сети";

        const vip = Number(s.vip) === 1
        ? `🚀 Продвигаемый практик

      ━━━━━━━━━━━━━━`
        : "";

        db.get(
  `
  SELECT COUNT(*) as favs
  FROM favorites
  WHERE specialist_id = ?
  `,
  [s.id],
  (err, favData) => {

    const favs =
      favData?.favs || 0;

    ctx.replyWithPhoto(
      {
        url: s.photo
      },
      {
        caption:
`${vip}

${s.emoji} ${s.name}

✅ Практик школы
🛡 Проверен администрацией

⭐ Рейтинг: ${s.avg_rating || "Нет оценок"}
💰 Цена: ${s.price}
🌍 Страна: ${s.country}
🧠 Опыт: ${s.experience}
🎓 Сертификаты школы: есть

❤️ В избранном: ${favs}

👥 Клиентов: ${s.clients}
⚡ Ответ: ${s.response}

${online}

${s.description}`,

        ...Markup.inlineKeyboard(buttons)

      }
    );

  }
);

      });

    }
  );

}

bot.action("register", (ctx) => {

  db.get(
    `
    SELECT *
    FROM specialists
    WHERE owner_id = ?
    `,
    [ctx.from.id],
    (err, existing) => {

      if (existing) {

        return ctx.reply(
          "❌ У вас уже есть анкета специалиста"
        );

      }

      registrationState[ctx.from.id] = {
        step: "name"
      };

      ctx.reply(
`📝 Регистрация специалиста

Введите ваше имя 👇

━━━━━━━━━━━━━━
❌ /cancel — отмена`
      );

    }
  );

});

bot.action(/reg_(.+)/, (ctx) => {

  const type = ctx.match[1];

  const reg = registrationState[ctx.from.id];

  if (!reg) {
    return;
  }

  reg.type = type;

  if (type === "relationships") {
  reg.emoji = "❤️";
}

if (type === "finance") {
  reg.emoji = "💰";
}

if (type === "health") {
  reg.emoji = "🩺";
}

if (type === "family") {
  reg.emoji = "👶";
}

if (type === "universal") {
  reg.emoji = "🌌";
}

  reg.step = "description";

  ctx.reply(
    `📝 Расскажите о себе и своей практике
    
    ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
  );

});

bot.action(/approve_(.+)/, (ctx) => {

  const id = ctx.match[1];

  db.run(
    "UPDATE specialists SET status = 'approved' WHERE id = ?",
    [id]
  );

  ctx.reply(
    "✅ Специалист одобрен"
  );

});

bot.action(/reject_(.+)/, (ctx) => {

  const id = ctx.match[1];

  db.run(
    "DELETE FROM specialists WHERE id = ?",
    [id]
  );

  ctx.reply(
    "❌ Заявка отклонена"
  );

});

bot.action("relationships", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "relationships");
});

bot.action("finance", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "finance");
});

bot.action("health", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "health");
});

bot.action("family", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "family");
});

bot.action("universal", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "universal");
});

bot.action("vip", (ctx) => {

  ctx.answerCbQuery();

  db.all(
    `
    SELECT
      specialists.*,
      ROUND(AVG(reviews.stars), 1) as avg_rating
    FROM specialists
    LEFT JOIN reviews
    ON specialists.id = reviews.specialist_id
    WHERE specialists.vip = 1
    GROUP BY specialists.id
    `,
    [],
    (err, list) => {

      if (err) {
        return ctx.reply("Ошибка базы данных");
      }

      if (!list.length) {
        return ctx.reply(
          "🚀 Продвигаемых практиков пока нет"
        );
      }

      list.forEach((s) => {

        const online = s.online
          ? "🟢 Сейчас онлайн"
          : "⚫ Не в сети";

        db.get(
          `
          SELECT COUNT(*) as favs
          FROM favorites
          WHERE specialist_id = ?
          `,
          [s.id],
          (err, favData) => {

            const favs =
              favData?.favs || 0;

            ctx.replyWithPhoto(
              {
                url: s.photo
              },
              {
                caption:
`🚀 Продвигаемый практик

${s.emoji} ${s.name}

🎓 Сертифицированный практик
🛡 Проверен школой

⭐ Рейтинг: ${s.avg_rating || "Нет оценок"}
❤️ В избранном: ${favs}

💰 Стоимость: ${s.price}
🌍 Страна: ${s.country}
🧠 Опыт: ${s.experience}

👥 Практик помог: ${s.clients}
⚡ Ответ: ${s.response}

${online}

${s.description}`,

                ...Markup.inlineKeyboard([
                  [
                    Markup.button.url(
                      "📩 Связаться",
                      `https://t.me/${s.telegram}`
                    )
                  ],
                  [
                    Markup.button.callback(
                      "❤️ В избранное",
                      `fav_${s.id}`
                    )
                  ]
                ])

              }
            );

          }
        );

      });

    }
  );

});

// bot.action("ai", (ctx) => {

//   ctx.answerCbQuery();

//   ctx.reply(
// `🤖 AI Расклад

// ✨ Карты показывают:

// ❤️ Скоро вас ждут перемены в личной жизни

// 💰 Финансовая ситуация улучшится

// 🔮 Очень важно доверять своей интуиции

// ⚡ Сейчас сильный период для новых решений`,
//     {
//       ...Markup.inlineKeyboard([
//         [
//           Markup.button.callback(
//             "🌌 Найти практикующего",
//             "universal"
//           )
//         ]
//       ])
//     }
//   );

// });

bot.action("safe", (ctx) => {

  ctx.answerCbQuery();

  ctx.reply(
`🛡 Гарантия безопасности

Мы вручную проверяем анкеты специалистов.

Запрещены:
• фейковые отзывы
• мошенничество
• агрессивные продажи
• выманивание денег

Нарушители блокируются навсегда.`
  );

});

bot.action(/leave_review_(.+)/, (ctx) => {

  const specialistId = ctx.match[1];

  userReviewState[ctx.from.id] = {
    specialistId
  };

  ctx.reply(
    "⭐ Выберите оценку:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("1⭐", "rate_1"),
        Markup.button.callback("2⭐", "rate_2"),
        Markup.button.callback("3⭐", "rate_3"),
        Markup.button.callback("4⭐", "rate_4"),
        Markup.button.callback("5⭐", "rate_5")
      ]
    ])
  );

});

bot.action(/rate_(.+)/, (ctx) => {

  const stars = Number(ctx.match[1]);

  if (!userReviewState[ctx.from.id]) {
    return ctx.reply("Ошибка");
  }

  userReviewState[ctx.from.id].stars = stars;

  ctx.reply(
`✍ Напишите отзыв о специалисте 👇

━━━━━━━━━━━━━━
❌ /cancel — отмена`
);

});

bot.action(/reviews_(.+)/, (ctx) => {

  const specialistId = ctx.match[1];

  db.all(
    "SELECT * FROM reviews WHERE specialist_id = ?",
    [specialistId],
    (err, reviews) => {

      if (err) {
        return ctx.reply("Ошибка загрузки отзывов");
      }

      if (!reviews.length) {
        return ctx.reply("Отзывов пока нет");
      }

      let text = "⭐ Отзывы\n\n";

      reviews.forEach((r) => {

        const stars = "⭐".repeat(r.stars);

        text += `${stars}\n`;
        text += `${r.user_name}\n`;
        text += `"${r.text}"\n\n`;

      });

      ctx.reply(text);

    }
  );

});

bot.action(/buy_vip_(.+)/, async (ctx) => {

  const specialistId = ctx.match[1];

  db.get(
    `
    SELECT *
    FROM specialists
    WHERE id = ?
    `,
    [specialistId],
    async (err, specialist) => {

      if (!specialist) {

        return ctx.reply(
          "Практик не найден"
        );

      }

      if (Number(specialist.vip) === 1) {

        return ctx.reply(
`🌟 У вас уже активирован статус
старшего практика 😄`
        );

      }

      await ctx.reply(
`🚀 Продвижение анкеты

После активации:

✅ Анкета выше в каталоге
✅ Больше просмотров
✅ Больше обращений
✅ Попадание в раздел
«Продвигаемые практики»

Стоимость:
1000 Telegram Stars ⭐`,
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        "💳 Оплатить Stars",
        `pay_vip_${specialistId}`
      )
    ]
  ])
);

    }
  );

});

bot.action(/pay_vip_(.+)/, async (ctx) => {

  const specialistId = ctx.match[1];

  await ctx.replyWithInvoice({
    title: "🚀 Продвижение анкеты",

    description:
      "Продвиньте анкету и получите больше клиентов.",

    payload: `vip_${specialistId}`,

    provider_token: "",

    currency: "XTR",

    prices: [
      {
        label: "🚀 Продвигаемый практик",
        amount: 10000
      }
    ]

  });

});

bot.command("pending", (ctx) => {

  db.all(
    "SELECT * FROM specialists WHERE status = 'pending'",
    [],
    (err, rows) => {

      if (err) {
        return ctx.reply("Ошибка базы данных");
      }

      if (!rows.length) {
        return ctx.reply("Нет заявок");
      }

      rows.forEach((s) => {


        
        ctx.replyWithPhoto(
          {
            url: s.photo
          },
          {
            caption:
`📝 Заявка на модерацию

ID: ${s.id}

${s.emoji} ${s.name}

📂 Категория: ${s.type}
🌍 Страна: ${s.country}
🧠 Опыт: ${s.experience}
🎓 Сертификаты школы: есть
💰 Цена: ${s.price}

📄 Описание:
${s.description}

📩 Telegram:
@${s.telegram}

Статус:
${s.status}`,
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "✅ Одобрить",
                  `approve_${s.id}`
                ),
                Markup.button.callback(
                  "❌ Отклонить",
                  `reject_${s.id}`
                )
              ]
            ])
          }
        );

      });

    }
  );

});

bot.action(/approve_(.+)/, (ctx) => {

  const id = ctx.match[1];

  db.run(
    "UPDATE specialists SET status = 'approved' WHERE id = ?",
    [id]
  );

  ctx.reply(
    "✅ Специалист одобрен"
  );

});

bot.action(/reject_(.+)/, (ctx) => {

  const id = ctx.match[1];

  db.run(
    "DELETE FROM specialists WHERE id = ?",
    [id]
  );

  ctx.reply(
    "❌ Заявка отклонена"
  );

});

bot.hears(/\/approve_(.+)/, (ctx) => {

  const id = ctx.match[1];

  db.run(
    "UPDATE specialists SET status = 'approved' WHERE id = ?",
    [id],
    (err) => {

      if (err) {
        return ctx.reply("Ошибка approve");
      }

      ctx.reply(
        "✅ Специалист одобрен"
      );

    }
  );

});

bot.command("stats", (ctx) => {

  db.all(
    "SELECT * FROM specialists",
    [],
    (err, rows) => {

      if (err) {
        return ctx.reply("Ошибка базы данных");
      }

      const vipCount = rows.filter(
        s => s.vip
      ).length;

      ctx.reply(
`📊 Статистика платформы

👥 Экспертов: ${rows.length}
🏆 Старших практиков: ${vipCount}`
      );

    }
  );

});

bot.command("vip_requests", (ctx) => {

  db.all(`
    SELECT
      vip_requests.id,
      specialists.name,
      specialists.telegram,
      specialists.id as specialist_id
    FROM vip_requests
    JOIN specialists
    ON specialists.id = vip_requests.specialist_id
  `, [], (err, rows) => {

    if (!rows.length) {
      return ctx.reply("VIP заявок нет");
    }

    rows.forEach((r) => {

      ctx.reply(
`🔥 Заявка на продвижение анкеты

${r.name}
@${r.telegram}

Approve:
/vip_${r.specialist_id}`
      );

    });

  });

});

bot.hears(/\/vip_(.+)/, (ctx) => {

  const id = ctx.match[1];

  db.run(
    "UPDATE specialists SET vip = 1 WHERE id = ?",
    [id],
    (err) => {

      if (err) {
        return ctx.reply("Ошибка VIP");
      }

      ctx.reply(
`🚀 Продвижение анкеты активировано!

Теперь ваша анкета будет показываться выше в каталоге 😄`
);

    }
  );

});

bot.action("my_profile", (ctx) => {

  db.get(
    `
    SELECT
      specialists.*,
      ROUND(AVG(reviews.stars), 1) as avg_rating
    FROM specialists
    LEFT JOIN reviews
    ON specialists.id = reviews.specialist_id
    WHERE specialists.owner_id = ?
    GROUP BY specialists.id
    `,
    [ctx.from.id],
    (err, s) => {

      if (err) {
        return ctx.reply("Ошибка базы данных");
      }

      if (!s) {
        return ctx.reply(
          "У вас пока нет анкеты специалиста"
        );
      }

      const vip = s.vip
        ? "🚀 Продвижение анкеты активно"
        : "❌ Продвижение анкеты не активно";

      db.get(
        `
        SELECT COUNT(*) as favs
        FROM favorites
        WHERE specialist_id = ?
        `,
        [s.id],
        (err, favData) => {

          const favs =
            favData?.favs || 0;

          ctx.replyWithPhoto(
            {
              url: s.photo
            },
            {
              caption:
`👤 Мой профиль

${s.emoji} ${s.name}

⭐ Рейтинг: ${s.avg_rating || "Нет оценок"}

👁 Просмотров: ${s.views || 0}
❤️ В избранном: ${favs}

💰 Цена: ${s.price}
🌍 Страна: ${s.country}
🧠 Опыт: ${s.experience}
🎓 Сертификаты школы: есть

${vip}

📄 Описание:
${s.description}`,

              ...Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    "✏ Изменить описание",
                    "edit_description"
                  )
                ],
                [
                  Markup.button.callback(
                    "💰 Изменить цену",
                    "edit_price"
                  )
                ],
                [
                  Markup.button.callback(
                    "📷 Изменить фото",
                    "edit_photo"
                  )
                ],
                [
                  Markup.button.callback(
                    "🚀 Продвижение анкеты",
                    `buy_vip_${s.id}`
                  )
                ]
              ])

            }
          );

        }
      );

    }
  );

});

bot.action("edit_description", (ctx) => {

  editState[ctx.from.id] = {
    type: "description"
  };

  ctx.reply(
    `✏ Введите новое описание
    
    ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
  );

});

bot.action("edit_price", (ctx) => {

  editState[ctx.from.id] = {
    type: "price"
  };

  ctx.reply(
    `💰 Введите новую цену
    
    ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
  );

});

bot.action("edit_photo", (ctx) => {

  editState[ctx.from.id] = {
    type: "photo"
  };

  ctx.reply(
    `📷 Отправьте новое фото
    
    ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
    );

});

bot.action("ai_match", (ctx) => {

  aiMatchState[ctx.from.id] = true;

  ctx.reply(
    `🤖 AI Подбор практикующего
    
    Опишите вашу ситуацию или проблему текстом.
    
    Например:
    • проблемы в отношениях
    • сложности в бизнесе
    • тревожность
    • финансовые проблемы
    
    ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
    );
    
    });

bot.action(/fav_(.+)/, (ctx) => {

  const specialistId = ctx.match[1];

  db.get(
    `
    SELECT * FROM favorites
    WHERE user_id = ?
    AND specialist_id = ?
    `,
    [
      ctx.from.id,
      specialistId
    ],
    (err, row) => {

      if (row) {

        return ctx.reply(
          "❤️ Уже в избранном"
        );

      }

      db.run(
        `
        INSERT INTO favorites (
          user_id,
          specialist_id
        )
        VALUES (?, ?)
        `,
        [
          ctx.from.id,
          specialistId
        ]
      );

      ctx.reply(
        "❤️ Специалист добавлен в избранное"
      );

    }
  );

});

bot.action("favorites", (ctx) => {

  db.all(
    `
    SELECT specialists.*
    FROM favorites
    JOIN specialists
    ON specialists.id = favorites.specialist_id
    WHERE favorites.user_id = ?
    `,
    [ctx.from.id],
    (err, list) => {

      if (err) {
        return ctx.reply("Ошибка базы данных");
      }

      if (!list.length) {
        return ctx.reply(
          "У вас пока нет избранных специалистов"
        );
      }

      list.forEach((s) => {

        ctx.replyWithPhoto(
          {
            url: s.photo
          },
          {
            caption:
`${s.emoji} ${s.name}

⭐ ${s.rating}
💰 ${s.price}

${s.description}`,
            ...Markup.inlineKeyboard([
              [
                Markup.button.url(
                  "📩 Написать",
                  `https://t.me/${s.telegram}`
                )
              ]
            ])
          }
        );

      });

    }
  );

});

bot.action("home", async (ctx) => {

  delete registrationState[ctx.from.id];
  delete editState[ctx.from.id];
  delete aiMatchState[ctx.from.id];
  delete userReviewState[ctx.from.id];

  await ctx.replyWithPhoto(
    {
      source: path.join(__dirname, "assets", "menu.png")
    },
    {
      caption:
`🔮 Остеопатия Души Мастера

Главное меню`,
      ...menu()
    }
  );

});

bot.command("cancel", (ctx) => {

  delete registrationState[ctx.from.id];
  delete editState[ctx.from.id];
  delete aiMatchState[ctx.from.id];
  delete userReviewState[ctx.from.id];

  ctx.reply(
    "❌ Действие отменено",
    menu()
  );

});

bot.on("text", (ctx) => {

  if (aiMatchState[ctx.from.id]) {

    delete aiMatchState[ctx.from.id];
  
    const userText = ctx.message.text;
  
    (async () => {
  
      try {
  
        const completion =
          await openai.chat.completions.create({
  
            model: "gpt-4.1-mini",
  
            messages: [
              {
                role: "system",
                content:
  `Ты AI помощник эзотерической платформы.
  
  Проанализируй проблему пользователя
  и выбери подходящие категории специалистов.
  
  Варианты:
  - relationships
  - finance
  - health
  - family
  - universal
  
  Отвечай ТОЛЬКО категориями через запятую.
  
  Пример:
  relationships,relationships`
              },
              {
                role: "user",
                content: userText
              }
            ]
  
          });
  
        const result =
          completion.choices[0]
          .message.content
          .toLowerCase();
  
        let specialists = [];
  
        if (result.includes("relationships")) {
          specialists.push("relationships");
        }
  
        if (result.includes("finance")) {
          specialists.push("finance");
        }
  
        if (result.includes("health")) {
          specialists.push("health");
        }
  
        if (result.includes("family")) {
          specialists.push("family");
        }
  
        if (result.includes("universal")) {
          specialists.push("universal");
        }
  
        if (!specialists.length) {
  
          return ctx.reply(
            "AI не смог подобрать специалистов"
          );
  
        }
  
        ctx.reply(
  `🤖 AI считает, что вам могут помочь:
  
  ${specialists.map(s => `• ${s}`).join("\n")}`
        );
  
        specialists.forEach((type) => {
          showExperts(ctx, type);
        });
  
      } catch (e) {

        console.log(e);
      
        let specialists = [];
      
        const text = userText.toLowerCase();
      
        if (
          text.includes("бизнес") ||
          text.includes("деньги") ||
          text.includes("финанс")
        ) {
      
          specialists.push("finance");
          specialists.push("universal");
      
        }
      
        if (
          text.includes("отнош") ||
          text.includes("любов")
        ) {
      
          specialists.push("relationships");
      
        }
      
        if (
          text.includes("трев") ||
          text.includes("энерг") ||
          text.includes("стресс")
        ) {
      
          specialists.push("universal");
      
        }
      
        if (
          text.includes("будущ") ||
          text.includes("судь")
        ) {
      
          specialists.push("health");
      
        }
      
        if (!specialists.length) {
      
          specialists.push("relationships");
      
        }
      
        const names = {
          relationships: "❤️ Отношения",
          finance: "💰 Финансы",
          health: "🩺 Здоровье",
          family: "👶 Дети и семья",
          universal: "🌌 Многопрофильный практик"
        };
        
        ctx.reply(
          "🤖 AI подобрал специалистов:\n\n" +
          specialists
            .map(s => `• ${names[s]}`)
            .join("\n")
        );
      
        specialists.forEach((type) => {
          showExperts(ctx, type);
        });
      
      }
  
    })();
  
    return;
  
  }

  const edit = editState[ctx.from.id];

if (edit) {

  if (edit.type === "description") {

    db.run(
      "UPDATE specialists SET description = ? WHERE owner_id = ?",
      [ctx.message.text, ctx.from.id]
    );

    delete editState[ctx.from.id];

    return ctx.reply(
      "✅ Описание обновлено"
    );

  }

  if (edit.type === "price") {

    db.run(
      "UPDATE specialists SET price = ? WHERE owner_id = ?",
      [ctx.message.text, ctx.from.id]
    );

    delete editState[ctx.from.id];

    return ctx.reply(
      "✅ Цена обновлена"
    );

  }

}

  const reg = registrationState[ctx.from.id];

  if (reg) {

    if (reg.step === "name") {

      reg.name = ctx.message.text;
      reg.step = "type";

      return ctx.reply(
  "🌿 Выберите направление практики",
  Markup.inlineKeyboard([
    [Markup.button.callback("❤️ Отношения", "reg_relationships")],
    [Markup.button.callback("💰 Финансы", "reg_finance")],
    [Markup.button.callback("🩺 Здоровье", "reg_health")],
    [Markup.button.callback("👶 Дети и семья", "reg_family")],
    [Markup.button.callback("🌌 Многопрофильный практик", "reg_universal")]
  ])
);

    }

    if (reg.step === "description") {

      reg.description = ctx.message.text;
      reg.step = "experience";

      return ctx.reply(
        `🧠 Введите ваш опыт практики
        
        ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
        );

    }

    if (reg.step === "experience") {

      reg.experience = ctx.message.text;
      reg.step = "country";

      return ctx.reply(
        `🌍 Введите страну
        
        ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
        );

    }

    if (reg.step === "country") {

      reg.country = ctx.message.text;
      reg.step = "price";

      return ctx.reply(
        `💰 Введите стоимость консультации
        
        ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
        );

    }

    if (reg.step === "price") {

      reg.price = ctx.message.text;
      reg.step = "photo";

      return ctx.reply(
        `📷 Отправьте фото
        
        ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
        );

    }

    if (reg.step === "telegram") {

      reg.telegram = ctx.message.text;

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
        reg.name,
        reg.type,
        reg.emoji,
        reg.price,
        reg.experience,
        reg.description,
        reg.telegram,
        "5.0",
        reg.country,
        1,
        0,
        0,
        "5 минут",
        reg.photo,
        "pending",
        ctx.from.id,
        0
      ]);

      delete registrationState[ctx.from.id];

      return ctx.reply(
        "✅ Заявка практикующего отправлена на модерацию"
      );

    }

  }

  const state = userReviewState[ctx.from.id];

  if (!state) {
    return;
  }

  const text = ctx.message.text;

  db.run(`
    INSERT INTO reviews (
      specialist_id,
      user_name,
      text,
      stars
    )
    VALUES (?, ?, ?, ?)
  `, [
    state.specialistId,
    ctx.from.first_name,
    text,
    state.stars || 5
  ]);

  delete userReviewState[ctx.from.id];

  ctx.reply(
    "✅ Спасибо! Ваш отзыв сохранен"
  );

});

bot.on("photo", async (ctx) => {

  const edit = editState[ctx.from.id];

if (edit && edit.type === "photo") {

  const photo = ctx.message.photo.pop();

  const file = await ctx.telegram.getFileLink(
    photo.file_id
  );

  db.run(
    "UPDATE specialists SET photo = ? WHERE owner_id = ?",
    [file.href, ctx.from.id]
  );

  delete editState[ctx.from.id];

  return ctx.reply(
    "✅ Фото обновлено"
  );

}

  const reg = registrationState[ctx.from.id];

  if (!reg) {
    return;
  }

  if (reg.step !== "photo") {
    return;
  }

  const photo = ctx.message.photo.pop();

  const file = await ctx.telegram.getFileLink(
    photo.file_id
  );

  reg.photo = file.href;

  reg.step = "telegram";

  ctx.reply(
    `📩 Введите Telegram username без @
    
    ━━━━━━━━━━━━━━
       ❌ /cancel — отмена`
    );

});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("successful_payment", (ctx) => {

  const payload =
    ctx.message.successful_payment.invoice_payload;

  if (payload.startsWith("vip_")) {

    const specialistId =
      payload.replace("vip_", "");

    db.run(
      `
      UPDATE specialists
      SET vip = 1
      WHERE id = ?
      `,
      [specialistId]
    );

    ctx.reply(
`🌟 Оплата прошла успешно!

🚀 Продвижение анкеты активировано!

Теперь ваша анкета будет показываться выше в каталоге 😄`
    );

  }

});

bot.launch();

console.log("🚀 Русская версия запущена");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));