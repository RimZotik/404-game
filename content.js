// Content script для обнаружения страниц 404 и замены их на игру

(function () {
  "use strict";

  // Проверяем, является ли страница ошибкой 404
  function is404Page() {
    // Проверяем заголовок документа
    const title = document.title.toLowerCase();
    if (
      title.includes("404") ||
      title.includes("not found") ||
      title.includes("page not found")
    ) {
      return true;
    }

    // Проверяем содержимое страницы
    const bodyText = document.body.textContent.toLowerCase();
    const errorKeywords = [
      "404",
      "not found",
      "page not found",
      "file not found",
      "страница не найдена",
    ];

    for (const keyword of errorKeywords) {
      if (bodyText.includes(keyword)) {
        return true;
      }
    }

    // Проверяем HTTP статус (если доступен)
    if (window.performance && window.performance.navigation) {
      const entries = performance.getEntriesByType("navigation");
      if (entries.length > 0 && entries[0].responseStatus === 404) {
        return true;
      }
    }

    return false;
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
                <style id="game-styles"></style>
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
  }

  // Загружаем ресурсы игры
  function loadGameAssets() {
    // Получаем URL расширения
    const extensionUrl = chrome.runtime.getURL("");

    // Загружаем CSS
    fetch(chrome.runtime.getURL("game.css"))
      .then((response) => response.text())
      .then((css) => {
        const styleElement = document.getElementById("game-styles");
        if (styleElement) {
          styleElement.textContent = css;
        }
      })
      .catch((error) => {
        console.log("CSS загружен встроенными стилями");
        // Встроенные стили как fallback
        loadFallbackStyles();
      });

    // Загружаем и выполняем JavaScript
    fetch(chrome.runtime.getURL("game.js"))
      .then((response) => response.text())
      .then((js) => {
        const script = document.createElement("script");
        script.textContent = js;
        document.body.appendChild(script);
      })
      .catch((error) => {
        console.log("JS загружен встроенной логикой");
        // Встроенная логика как fallback
        loadFallbackGameLogic();
      });
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
        `;

    const styleElement = document.getElementById("game-styles");
    if (styleElement) {
      styleElement.textContent = styles;
    }
  }

  // Fallback игровая логика
  function loadFallbackGameLogic() {
    let score = 0;
    let enemies = [];
    let gameRunning = true;

    const turret = document.getElementById("turret");
    const scoreElement = document.getElementById("score");
    const gameArea = document.getElementById("game-area");
    const enemiesContainer = document.getElementById("enemies-container");

    // Отслеживание мыши для турели
    document.addEventListener("mousemove", (e) => {
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
      enemy.addEventListener("click", () => {
        const hits = parseInt(enemy.dataset.hits) + 1;
        enemy.dataset.hits = hits;

        if (hits === 1 || hits === 2) {
          enemy.classList.add("hit");
        } else if (hits >= 3) {
          enemy.classList.add("dead");
          score++;
          scoreElement.textContent = score;

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

  // Запускаем проверку после загрузки страницы
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        if (is404Page()) {
          replaceWithGame();
        }
      }, 500); // Небольшая задержка для уверенности
    });
  } else {
    setTimeout(() => {
      if (is404Page()) {
        replaceWithGame();
      }
    }, 500);
  }
})();
