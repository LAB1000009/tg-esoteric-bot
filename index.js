require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const OpenAI = require("openai");
const db = require("./database");

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
    [Markup.button.callback("🏠 Главное меню", "home")],
    [Markup.button.callback("👤 Мой профиль", "my_profile")],
    [Markup.button.callback("🤖 AI Подбор специалиста", "ai_match")],
    [Markup.button.callback("📂 Избранное", "favorites")],
    [Markup.button.callback("🔮 Тарологи", "tarot")],
    [Markup.button.callback("⭐ Астрологи", "astrology")],
    [Markup.button.callback("🪬 Руны", "runes")],
    [Markup.button.callback("🧘 Энергопрактики", "energy")],
    [Markup.button.callback("🏆 VIP Эксперты", "vip")],
    [Markup.button.callback("🤖 AI Расклад", "ai")],
    [Markup.button.callback("📝 Стать специалистом", "register")],
    [Markup.button.callback("🛡 Гарантия безопасности", "safe")]
  ]);
}

bot.start(async (ctx) => {

  await ctx.replyWithPhoto(
    {
      url: "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?q=80&w=1200"
    },
    {
      caption:
`🔮 Esoteric Hub Ultimate

Платформа проверенных эзотерических специалистов.

✅ Ручная модерация анкет
✅ Проверенные отзывы
✅ Только активные эксперты
✅ Защита от фейков и мошенников

Найдите своего специалиста:

• Тарологи
• Астрологи
• Руны
• Энергопрактики

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

        // db.run(
        //   `
        //   INSERT INTO profile_views (
        //     specialist_id,
        //     viewer_id
        //   )
        //   VALUES (?, ?)
        //   `,
        //   [
        //     s.id,
        //     ctx.from.id
        //   ]
        // );

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
              "🔥 Купить VIP",
              `buy_vip_${s.id}`
            )
          ]);

        }

        const online = s.online
          ? "🟢 Сейчас онлайн"
          : "⚫ Не в сети";

        const vip = Number(s.vip) === 1
          ? "🔥 VIP Эксперт"
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
`${s.emoji} ${s.name}

${vip}
✅ Проверенный специалист
🛡 Проверен администрацией

⭐ Рейтинг: ${s.avg_rating || "Нет оценок"}
💰 Цена: ${s.price}
🌍 Страна: ${s.country}
🧠 Опыт: ${s.experience}

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

  if (type === "tarot") {
    reg.emoji = "🔮";
  }

  if (type === "astrology") {
    reg.emoji = "⭐";
  }

  if (type === "runes") {
    reg.emoji = "🪬";
  }

  if (type === "energy") {
    reg.emoji = "🧘";
  }

  reg.step = "description";

  ctx.reply(
    `📝 Опишите себя
    
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

bot.action("tarot", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "tarot");
});

bot.action("astrology", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "astrology");
});

bot.action("runes", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "runes");
});

bot.action("energy", (ctx) => {
  ctx.answerCbQuery();
  showExperts(ctx, "energy");
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
    (err, vipExperts) => {

      if (err) {
        return ctx.reply("Ошибка базы данных");
      }

      vipExperts.forEach((s) => {

        ctx.reply(
`🏆 VIP Эксперт

${s.emoji} ${s.name}
⭐ ${s.avg_rating || "Нет оценок"}
💰 ${s.price}`,
          {
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

bot.action("ai", (ctx) => {

  ctx.answerCbQuery();

  ctx.reply(
`🤖 AI Расклад

✨ Карты показывают:

❤️ Скоро вас ждут перемены в личной жизни

💰 Финансовая ситуация улучшится

🔮 Очень важно доверять своей интуиции

⚡ Сейчас сильный период для новых решений`,
    {
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔮 Найти специалиста",
            "tarot"
          )
        ]
      ])
    }
  );

});

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

bot.action(/buy_vip_(.+)/, (ctx) => {

  const specialistId = ctx.match[1];

  db.run(`
    INSERT INTO vip_requests (
      specialist_id,
      created_at
    )
    VALUES (?, datetime('now'))
  `, [
    specialistId
  ]);

  ctx.reply(
`🔥 Заявка на VIP отправлена.

Администратор свяжется с вами для оплаты.`
  );

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
🏆 VIP Экспертов: ${vipCount}`
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
`🔥 VIP заявка

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
        "🔥 VIP активирован"
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
        ? "🔥 VIP активен"
        : "❌ VIP не активен";

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
                    "🔥 Купить VIP",
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
    `🤖 AI Подбор
    
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
      url: "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?q=80&w=1200"
    },
    {
      caption:
`🔮 Esoteric Hub Ultimate

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
  - tarot
  - astrology
  - runes
  - energy
  
  Отвечай ТОЛЬКО категориями через запятую.
  
  Пример:
  tarot,energy`
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
  
        if (result.includes("tarot")) {
          specialists.push("tarot");
        }
  
        if (result.includes("astrology")) {
          specialists.push("astrology");
        }
  
        if (result.includes("runes")) {
          specialists.push("runes");
        }
  
        if (result.includes("energy")) {
          specialists.push("energy");
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
      
          specialists.push("tarot");
          specialists.push("astrology");
      
        }
      
        if (
          text.includes("отнош") ||
          text.includes("любов")
        ) {
      
          specialists.push("tarot");
      
        }
      
        if (
          text.includes("трев") ||
          text.includes("энерг") ||
          text.includes("стресс")
        ) {
      
          specialists.push("energy");
      
        }
      
        if (
          text.includes("будущ") ||
          text.includes("судь")
        ) {
      
          specialists.push("runes");
      
        }
      
        if (!specialists.length) {
      
          specialists.push("tarot");
      
        }
      
        const names = {
          tarot: "🔮 Тарологи",
          astrology: "⭐ Астрологи",
          runes: "🪬 Руны",
          energy: "🧘 Энергопрактики"
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
        "Выберите категорию",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔮 Таролог", "reg_tarot")],
          [Markup.button.callback("⭐ Астролог", "reg_astrology")],
          [Markup.button.callback("🪬 Руны", "reg_runes")],
          [Markup.button.callback("🧘 Энергопрактик", "reg_energy")]
        ])
      );

    }

    if (reg.step === "description") {

      reg.description = ctx.message.text;
      reg.step = "experience";

      return ctx.reply(
        `🧠 Введите опыт работы
        
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
        `💰 Введите цену
        
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
        "✅ Заявка отправлена на модерацию"
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

bot.launch();

console.log("🚀 Русская версия запущена");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));