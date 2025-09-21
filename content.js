// Content script для обнаружения страниц 404 и замены их на игру

(function () {
  "use strict";

  // Проверяем, является ли страница ошибкой 404
  function is404Page() {
    console.log("404 Turret Game: Проверяем is404Page...");

    // Не запускаем на популярных сайтах и доменах
    const hostname = window.location.hostname.toLowerCase();
    console.log("Hostname:", hostname);

    const excludedDomains = [
      "google.com",
      "youtube.com",
      "facebook.com",
      "twitter.com",
      "instagram.com",
      "linkedin.com",
      "github.com",
      "stackoverflow.com",
      "reddit.com",
      "wikipedia.org",
      "amazon.com",
      "ebay.com",
      "vk.com",
      "ok.ru",
      "mail.ru",
      "yandex.ru",
      "bing.com",
      "yahoo.com",
      "discord.com",
      "telegram.org",
      "whatsapp.com",
    ];

    for (const domain of excludedDomains) {
      if (hostname.includes(domain)) {
        console.log("404 Turret Game: Исключен домен:", domain);
        return false;
      }
    }

    // Не запускаем на локальных файлах и особых протоколах
    const protocol = window.location.protocol;
    console.log("Protocol:", protocol);
    if (
      protocol === "file:" ||
      protocol === "chrome:" ||
      protocol === "chrome-extension:" ||
      protocol === "moz-extension:"
    ) {
      console.log("404 Turret Game: Исключен протокол:", protocol);
      return false;
    }

    // Исключаем страницы с типичными путями не-404, НО только если они НЕ возвращают 404
    const pathname = window.location.pathname.toLowerCase();
    console.log("Pathname:", pathname);

    // Сначала проверим HTTP статус
    let statusIs404 = false;
    try {
      const navigationEntries = performance.getEntriesByType("navigation");
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        console.log("Performance API status:", navEntry.responseStatus);
        if (navEntry.responseStatus === 404) {
          statusIs404 = true;
        }
      }
    } catch (e) {
      console.log("Performance API error:", e);
    }

    // Если статус 404, то не исключаем даже админские пути
    if (!statusIs404) {
      const excludedPaths = [
        "/login",
        "/register",
        "/signup",
        "/auth",
        "/admin",
        "/dashboard",
        "/search",
        "/api/",
        "/account",
        "/profile",
        "/settings",
        "/help",
        "/contact",
        "/about",
        "/blog",
        "/news",
        "/shop",
        "/cart",
        "/checkout",
      ];

      for (const path of excludedPaths) {
        if (pathname.includes(path)) {
          console.log(
            "404 Turret Game: Исключен путь (но только потому что статус НЕ 404):",
            path
          );
          return false;
        }
      }
    } else {
      console.log(
        "404 Turret Game: Статус 404 обнаружен, игнорируем исключения путей"
      );
    }

    // Строгая проверка заголовка - должен явно содержать 404
    const title = document.title.toLowerCase();
    console.log("Title (lowercase):", title);
    const titleHas404 =
      title.includes("404") &&
      (title.includes("not found") ||
        title.includes("page not found") ||
        title.includes("error") ||
        title.includes("страница не найдена"));

    // Простая проверка - если заголовок точно "404 not found", это почти наверняка 404
    const simpleTitle404 = title === "404 not found";
    console.log("Title has 404:", titleHas404);
    console.log("Simple title 404:", simpleTitle404);

    // Проверяем основные заголовки страницы
    const h1Elements = document.querySelectorAll(
      "h1, h2, .error-title, .error-heading"
    );
    let headerHas404 = false;
    h1Elements.forEach((el) => {
      const text = el.textContent.toLowerCase();
      console.log("Header text:", text);
      if (
        text.includes("404") &&
        (text.includes("not found") || text.includes("error"))
      ) {
        headerHas404 = true;
      }
    });
    console.log("Header has 404:", headerHas404);

    // Проверяем мета-теги
    const metaDescription = document.querySelector('meta[name="description"]');
    const metaHas404 =
      metaDescription &&
      metaDescription.content.toLowerCase().includes("404") &&
      metaDescription.content.toLowerCase().includes("not found");
    console.log("Meta has 404:", metaHas404);

    // Проверяем размер контента - 404 страницы обычно короткие
    const bodyText = document.body.textContent.trim();
    const isShortContent = bodyText.length < 2000; // Менее 2000 символов
    console.log(
      "Is short content:",
      isShortContent,
      "Length:",
      bodyText.length
    );

    // Проверяем наличие типичных 404 фраз в небольшом количестве
    const errorPhrases = [
      "page not found",
      "file not found",
      "страница не найдена",
      "the requested url",
      "resource not found",
      "404 error",
      "not found", // Добавим простую фразу
    ];

    let phraseCount = 0;
    const lowerBodyText = bodyText.toLowerCase();
    console.log(
      "Body text (first 200 chars):",
      lowerBodyText.substring(0, 200)
    );

    errorPhrases.forEach((phrase) => {
      if (lowerBodyText.includes(phrase)) {
        phraseCount++;
        console.log("Found phrase:", phrase);
      }
    });
    console.log("Phrase count:", phraseCount);

    // Специальная проверка для nginx 404 страниц
    const isNginx404 =
      title.includes("404 not found") &&
      lowerBodyText.includes("nginx") &&
      isShortContent;
    console.log("Is nginx 404:", isNginx404);

    // Окончательное решение: нужно несколько условий одновременно
    const conditions = [
      statusIs404,
      titleHas404,
      simpleTitle404, // Добавим простую проверку заголовка
      headerHas404,
      metaHas404,
      phraseCount >= 1 && isShortContent, // Понизим требование
      lowerBodyText.includes("404") && isShortContent,
      isNginx404, // Добавим специальную проверку nginx
    ];

    console.log("Conditions:", {
      statusIs404,
      titleHas404,
      simpleTitle404,
      headerHas404,
      metaHas404,
      phraseAndShort: phraseCount >= 1 && isShortContent,
      "404AndShort": lowerBodyText.includes("404") && isShortContent,
      isNginx404,
    });

    const trueConditions = conditions.filter(Boolean).length;
    console.log("True conditions count:", trueConditions);

    // Упростим условие: если есть HTTP 404 ИЛИ простой заголовок 404 ИЛИ минимум 1 другое условие
    const result = statusIs404 || simpleTitle404 || trueConditions >= 1;
    console.log("Final result:", result);
    return result;
  }

  // Заменяем содержимое страницы на игру
  function replaceWithGame() {
    // Очищаем всю страницу
    document.documentElement.innerHTML = "";

    // Создаем новую структуру HTML
    const html = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>404 - Turret Defense Game</title>
            </head>
            <body>
                <div id="game-container">
                    <div id="score-display">
                        <span>Убито: </span>
                        <span id="score">0</span>
                    </div>
                    <div id="game-area">
                        <div id="turret"></div>
                        <div id="enemies-container"></div>
                    </div>
                    <div id="game-info">
                        <h1>404 - Страница не найдена</h1>
                        <p>Но вы можете поиграть в нашу мини-игру! Защитите центр от вирусов!</p>
                        <p>Управление: наведите мышку на врага и кликните 3 раза для уничтожения</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    document.documentElement.innerHTML = html;

    // Загружаем CSS и JS для игры
    loadGameAssets();

    // Запускаем fallback через 3 секунды если основная игра не загрузилась
    setTimeout(() => {
      if (!window.turretGame && !document.querySelector(".enemy")) {
        console.log(
          "404 Turret Game: Основная игра не загрузилась, принудительно запускаем fallback"
        );
        loadFallbackGameLogic();
      }
    }, 3000);
  }

  // Загружаем ресурсы игры
  function loadGameAssets() {
    // Загружаем CSS
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = chrome.runtime.getURL("game.css");
    linkElement.onload = () => {
      console.log("404 Turret Game: game.css загружен успешно");
    };
    linkElement.onerror = () => {
      console.log(
        "404 Turret Game: Ошибка загрузки game.css, используем fallback"
      );
      loadFallbackStyles();
    };
    document.head.appendChild(linkElement);

    // Загружаем и выполняем JavaScript
    console.log("404 Turret Game: Пытаемся загрузить game.js");
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("game.js");
    script.onload = () => {
      console.log("404 Turret Game: game.js загружен успешно");
      // Проверяем, инициализировалась ли игра
      setTimeout(() => {
        if (!window.turretGame) {
          console.log(
            "404 Turret Game: Игра не инициализировалась, запускаем fallback"
          );
          loadFallbackGameLogic();
        }
      }, 1000);
    };
    script.onerror = () => {
      console.log(
        "404 Turret Game: Ошибка загрузки game.js, используем fallback"
      );
      loadFallbackGameLogic();
    };
    document.body.appendChild(script);
  }

  // Fallback стили
  function loadFallbackStyles() {
    const styles = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                background: linear-gradient(135deg, #1e3c72, #2a5298);
                font-family: 'Arial', sans-serif;
                overflow: hidden;
                height: 100vh;
            }

            #game-container {
                position: relative;
                width: 100vw;
                height: 100vh;
            }

            #score-display {
                position: absolute;
                top: 20px;
                right: 20px;
                color: white;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                z-index: 1000;
            }

            #game-area {
                position: relative;
                width: 100%;
                height: 100%;
            }

            #turret {
                position: absolute;
                width: 60px;
                height: 60px;
                background: #ff6b6b;
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border: 4px solid #ff5252;
                box-shadow: 0 0 20px rgba(255, 107, 107, 0.6);
                z-index: 100;
            }

            #turret::before {
                content: '';
                position: absolute;
                width: 40px;
                height: 8px;
                background: #ff5252;
                top: 50%;
                left: 50%;
                transform-origin: left center;
                transform: translate(0, -50%);
                border-radius: 4px;
            }

            .enemy {
                position: absolute;
                width: 30px;
                height: 30px;
                background: #4ecdc4;
                border-radius: 50%;
                border: 2px solid #26d0ce;
                box-shadow: 0 0 10px rgba(78, 205, 196, 0.6);
                cursor: pointer;
                transition: all 0.1s ease;
            }

            .enemy.hit {
                background: #ff9800;
                transform: scale(0.8);
            }

            .enemy.dead {
                background: #f44336;
                transform: scale(0.5);
                opacity: 0;
            }

            #game-info {
                position: absolute;
                bottom: 20px;
                left: 20px;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                max-width: 400px;
            }

            #game-info h1 {
                font-size: 32px;
                margin-bottom: 10px;
            }

            #game-info p {
                font-size: 14px;
                margin-bottom: 5px;
                opacity: 0.9;
            }

            @keyframes hitExplosion {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.2) rotate(180deg);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(0) rotate(360deg);
                    opacity: 0;
                }
            }

            @keyframes sparkFly {
                0% {
                    transform: scale(1) translateX(0) translateY(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(0) translateX(20px) translateY(20px);
                    opacity: 0;
                }
            }

            @keyframes deathExplosion {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.5) rotate(180deg);
                    opacity: 0.9;
                }
                100% {
                    transform: scale(3) rotate(360deg);
                    opacity: 0;
                }
            }

            @keyframes scoreUpdate {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;

    const styleElement = document.getElementById("game-styles");
    if (styleElement) {
      styleElement.textContent = styles;
    }
  }

  // Fallback игровая логика
  function loadFallbackGameLogic() {
    console.log("404 Turret Game: Загружаем fallback логику");

    let score = 0;
    let enemies = [];
    let gameRunning = true;

    const turret = document.getElementById("turret");
    const scoreElement = document.getElementById("score");
    const gameArea = document.getElementById("game-area");
    const enemiesContainer = document.getElementById("enemies-container");

    if (!turret || !scoreElement || !gameArea || !enemiesContainer) {
      console.error("404 Turret Game: Не найдены необходимые элементы:", {
        turret: !!turret,
        scoreElement: !!scoreElement,
        gameArea: !!gameArea,
        enemiesContainer: !!enemiesContainer,
      });
      return;
    }

    console.log("404 Turret Game: Все элементы найдены, инициализируем игру");

    // Отслеживание мыши для турели
    document.addEventListener("mousemove", (e) => {
      if (!gameArea || !turret) return;

      const rect = gameArea.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
      turret.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    });

    // Создание врага
    function createEnemy() {
      const enemy = document.createElement("div");
      enemy.className = "enemy";
      enemy.dataset.hits = "0";

      // Случайная позиция на краю экрана
      const side = Math.floor(Math.random() * 4);
      const gameRect = gameArea.getBoundingClientRect();

      switch (side) {
        case 0: // top
          enemy.style.left = Math.random() * gameRect.width + "px";
          enemy.style.top = "0px";
          break;
        case 1: // right
          enemy.style.left = gameRect.width + "px";
          enemy.style.top = Math.random() * gameRect.height + "px";
          break;
        case 2: // bottom
          enemy.style.left = Math.random() * gameRect.width + "px";
          enemy.style.top = gameRect.height + "px";
          break;
        case 3: // left
          enemy.style.left = "0px";
          enemy.style.top = Math.random() * gameRect.height + "px";
          break;
      }

      // Обработчик клика
      enemy.addEventListener("click", (e) => {
        const hits = parseInt(enemy.dataset.hits) + 1;
        enemy.dataset.hits = hits;

        // Создаем эффект попадания
        createHitEffect(e.clientX, e.clientY);

        // Визуальная обратная связь
        enemy.style.transform = "scale(1.2)";
        setTimeout(() => {
          if (enemy.parentNode) {
            enemy.style.transform = "scale(1)";
          }
        }, 150);

        if (hits === 1) {
          enemy.classList.add("hit");
          enemy.style.background = "radial-gradient(circle, #ffeb3b, #ffc107)";
          enemy.style.borderColor = "#ff9800";
        } else if (hits === 2) {
          enemy.style.background = "radial-gradient(circle, #ff9800, #f57c00)";
          enemy.style.borderColor = "#ef6c00";
          enemy.style.boxShadow = "0 0 20px rgba(255, 152, 0, 0.9)";
        } else if (hits >= 3) {
          enemy.classList.add("dead");

          // Эффект взрыва при уничтожении
          createDeathEffect(enemy);

          score++;
          scoreElement.textContent = score;

          // Анимация счетчика
          scoreElement.style.transform = "scale(1.3)";
          scoreElement.style.color = "#00ff00";
          setTimeout(() => {
            scoreElement.style.transform = "scale(1)";
            scoreElement.style.color = "#ffd700";
          }, 200);

          setTimeout(() => {
            if (enemy.parentNode) {
              enemy.parentNode.removeChild(enemy);
            }
            const index = enemies.indexOf(enemy);
            if (index > -1) {
              enemies.splice(index, 1);
            }
          }, 200);
        }
      });

      enemiesContainer.appendChild(enemy);
      enemies.push(enemy);

      // Движение врага к центру
      moveEnemyToCenter(enemy);
    }

    // Движение врага к центру
    function moveEnemyToCenter(enemy) {
      const gameRect = gameArea.getBoundingClientRect();
      const centerX = gameRect.width / 2;
      const centerY = gameRect.height / 2;

      const startX = parseFloat(enemy.style.left);
      const startY = parseFloat(enemy.style.top);

      const deltaX = centerX - startX;
      const deltaY = centerY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const speed = 50; // пикселей в секунду
      const duration = (distance / speed) * 1000; // в миллисекундах

      enemy.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
      enemy.style.left = centerX + "px";
      enemy.style.top = centerY + "px";

      // Удаляем врага, если он дошел до центра
      setTimeout(() => {
        if (enemy.parentNode && !enemy.classList.contains("dead")) {
          enemy.parentNode.removeChild(enemy);
          const index = enemies.indexOf(enemy);
          if (index > -1) {
            enemies.splice(index, 1);
          }
        }
      }, duration);
    }

    // Функция создания эффекта попадания
    function createHitEffect(x, y) {
      // Основной эффект
      const effect = document.createElement("div");
      effect.style.position = "fixed";
      effect.style.left = x - 15 + "px";
      effect.style.top = y - 15 + "px";
      effect.style.width = "30px";
      effect.style.height = "30px";
      effect.style.background =
        "radial-gradient(circle, #ffeb3b, #ffc107, transparent)";
      effect.style.borderRadius = "50%";
      effect.style.pointerEvents = "none";
      effect.style.zIndex = "10000";
      effect.style.animation = "hitExplosion 0.3s ease-out";

      document.body.appendChild(effect);

      // Искры
      for (let i = 0; i < 4; i++) {
        const spark = document.createElement("div");
        spark.style.position = "fixed";
        spark.style.left = x + (Math.random() - 0.5) * 20 + "px";
        spark.style.top = y + (Math.random() - 0.5) * 20 + "px";
        spark.style.width = "6px";
        spark.style.height = "6px";
        spark.style.background = "radial-gradient(circle, #ff5722, #ff9800)";
        spark.style.borderRadius = "50%";
        spark.style.pointerEvents = "none";
        spark.style.zIndex = "9999";
        spark.style.animation = "sparkFly 0.4s ease-out";

        document.body.appendChild(spark);

        setTimeout(() => {
          if (spark.parentNode) {
            spark.parentNode.removeChild(spark);
          }
        }, 400);
      }

      setTimeout(() => {
        if (effect.parentNode) {
          effect.parentNode.removeChild(effect);
        }
      }, 300);
    }

    // Функция создания эффекта взрыва при уничтожении
    function createDeathEffect(enemyElement) {
      const rect = enemyElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Основной взрыв
      const explosion = document.createElement("div");
      explosion.style.position = "fixed";
      explosion.style.left = centerX - 25 + "px";
      explosion.style.top = centerY - 25 + "px";
      explosion.style.width = "50px";
      explosion.style.height = "50px";
      explosion.style.background =
        "radial-gradient(circle, #f44336, #ff9800, transparent)";
      explosion.style.borderRadius = "50%";
      explosion.style.pointerEvents = "none";
      explosion.style.zIndex = "10000";
      explosion.style.animation = "deathExplosion 0.5s ease-out";

      document.body.appendChild(explosion);

      // Частицы взрыва
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement("div");
        const angle = (i / 8) * 2 * Math.PI;
        const distance = 30 + Math.random() * 20;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.style.position = "fixed";
        particle.style.left = centerX + "px";
        particle.style.top = centerY + "px";
        particle.style.width = "8px";
        particle.style.height = "8px";
        particle.style.background = "#f44336";
        particle.style.borderRadius = "50%";
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "9999";
        particle.style.transition = "all 0.6s ease-out";
        particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
        particle.style.opacity = "0";

        document.body.appendChild(particle);

        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 600);
      }

      setTimeout(() => {
        if (explosion.parentNode) {
          explosion.parentNode.removeChild(explosion);
        }
      }, 500);
    }

    // Спавн врагов
    function spawnEnemies() {
      if (gameRunning) {
        createEnemy();
        setTimeout(spawnEnemies, 2000 + Math.random() * 2000); // каждые 2-4 секунды
      }
    }

    // Запуск игры
    setTimeout(spawnEnemies, 1000);
  }

  // Функция для безопасной проверки 404
  function safeCheck404() {
    console.log("404 Turret Game: Начинаем проверку страницы...");
    console.log("URL:", window.location.href);
    console.log("Title:", document.title);
    console.log("Body text length:", document.body.textContent.trim().length);

    // Дополнительная проверка - не запускаем если страница активно загружается
    if (document.readyState === "loading") {
      console.log("404 Turret Game: Страница еще загружается, пропускаем");
      return false;
    }

    // Проверяем что у нас есть минимальный контент
    if (!document.body || document.body.textContent.trim().length < 10) {
      console.log("404 Turret Game: Слишком мало контента, пропускаем");
      return false;
    }

    // Не запускаем на страницах с формами (скорее всего это не 404)
    const formCount = document.querySelectorAll(
      'form, input[type="search"], input[type="text"]'
    ).length;
    if (formCount > 2) {
      console.log(
        "404 Turret Game: Много форм (" + formCount + "), пропускаем"
      );
      return false;
    }

    // Не запускаем на страницах с большим количеством ссылок (скорее всего это не 404)
    const linkCount = document.querySelectorAll("a[href]").length;
    if (linkCount > 20) {
      console.log(
        "404 Turret Game: Много ссылок (" + linkCount + "), пропускаем"
      );
      return false;
    }

    const result = is404Page();
    console.log("404 Turret Game: Результат проверки is404Page:", result);
    return result;
  }

  // Запускаем проверку после загрузки страницы
  function initCheck() {
    // Проверяем через большую задержку для уверенности
    setTimeout(() => {
      if (safeCheck404()) {
        console.log("404 Turret Game: Обнаружена страница 404, запускаем игру");
        replaceWithGame();
      }
    }, 1500); // Увеличиваем задержку до 1.5 секунд
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCheck);
  } else {
    initCheck();
  }
})();
