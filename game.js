// Игровая логика для 404 Turret Defense Game

class TurretGame {
  constructor() {
    this.score = 0;
    this.enemies = [];
    this.gameRunning = true;
    this.spawnRate = 2000; // миллисекунды между спавнами
    this.enemySpeed = 30; // пикселей в секунду
    this.maxEnemies = 15; // максимальное количество врагов на экране

    this.init();
  }

  init() {
    this.turret = document.getElementById("turret");
    this.scoreElement = document.getElementById("score");
    this.gameArea = document.getElementById("game-area");
    this.enemiesContainer = document.getElementById("enemies-container");

    if (
      !this.turret ||
      !this.scoreElement ||
      !this.gameArea ||
      !this.enemiesContainer
    ) {
      console.error("Не удалось найти необходимые элементы игры");
      return;
    }

    this.setupEventListeners();
    this.startGame();
  }

  setupEventListeners() {
    // Отслеживание движения мыши для поворота турели
    document.addEventListener("mousemove", (e) => this.rotateTurret(e));

    // Предотвращение контекстного меню
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // Обработка изменения размера окна
    window.addEventListener("resize", () => this.handleResize());
  }

  rotateTurret(event) {
    const rect = this.gameArea.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
    this.turret.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }

  startGame() {
    this.spawnEnemies();
    this.gameLoop();
  }

  gameLoop() {
    if (this.gameRunning) {
      this.updateEnemies();
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  spawnEnemies() {
    if (!this.gameRunning) return;

    if (this.enemies.length < this.maxEnemies) {
      this.createEnemy();
    }

    // Увеличиваем сложность со временем
    const difficultyMultiplier = Math.max(0.5, 1 - this.score * 0.02);
    const nextSpawnDelay =
      this.spawnRate * difficultyMultiplier + Math.random() * 1000;

    setTimeout(() => this.spawnEnemies(), nextSpawnDelay);
  }

  createEnemy() {
    const enemy = document.createElement("div");
    enemy.className = "enemy enemy-spawn";
    enemy.dataset.hits = "0";
    enemy.dataset.maxHits = "3";

    // Позиционируем врага на случайном краю экрана
    const position = this.getRandomSpawnPosition();
    enemy.style.left = position.x + "px";
    enemy.style.top = position.y + "px";

    // Случайный размер и скорость для разнообразия
    const sizeVariation = 0.8 + Math.random() * 0.4; // от 0.8 до 1.2
    const speedVariation = 0.7 + Math.random() * 0.6; // от 0.7 до 1.3

    enemy.style.transform = `scale(${sizeVariation})`;
    enemy.dataset.speed = speedVariation.toString();

    // Добавляем обработчик клика
    enemy.addEventListener("click", (e) => this.hitEnemy(e, enemy));

    // Эффект появления
    enemy.style.opacity = "0";
    enemy.style.transform += " scale(0)";

    this.enemiesContainer.appendChild(enemy);

    // Анимация появления
    setTimeout(() => {
      enemy.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      enemy.style.opacity = "1";
      enemy.style.transform = `scale(${sizeVariation})`;
    }, 50);

    this.enemies.push({
      element: enemy,
      startX: position.x,
      startY: position.y,
      targetX: this.gameArea.offsetWidth / 2,
      targetY: this.gameArea.offsetHeight / 2,
      startTime: Date.now(),
      hits: 0,
      speed: speedVariation,
    });

    // Анимация движения к центру с задержкой для эффекта появления
    setTimeout(() => {
      this.moveEnemyToCenter(enemy);
    }, 300);
  }

  getRandomSpawnPosition() {
    const gameRect = this.gameArea.getBoundingClientRect();
    const side = Math.floor(Math.random() * 4);
    const margin = 50; // отступ от края экрана

    switch (side) {
      case 0: // верх
        return {
          x: Math.random() * gameRect.width,
          y: -margin,
        };
      case 1: // право
        return {
          x: gameRect.width + margin,
          y: Math.random() * gameRect.height,
        };
      case 2: // низ
        return {
          x: Math.random() * gameRect.width,
          y: gameRect.height + margin,
        };
      case 3: // лево
        return {
          x: -margin,
          y: Math.random() * gameRect.height,
        };
      default:
        return { x: 0, y: 0 };
    }
  }

  moveEnemyToCenter(enemyElement) {
    const gameRect = this.gameArea.getBoundingClientRect();
    const centerX = gameRect.width / 2;
    const centerY = gameRect.height / 2;

    const startX = parseFloat(enemyElement.style.left);
    const startY = parseFloat(enemyElement.style.top);

    const deltaX = centerX - startX;
    const deltaY = centerY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Получаем индивидуальную скорость врага
    const enemyData = this.enemies.find((e) => e.element === enemyElement);
    const speedMultiplier = enemyData ? enemyData.speed : 1;

    // Вычисляем время движения на основе скорости
    const baseSpeed = this.enemySpeed * speedMultiplier;
    const duration = (distance / baseSpeed) * 1000;

    enemyElement.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
    enemyElement.style.left = centerX + "px";
    enemyElement.style.top = centerY + "px";

    // Удаляем врага, если он достиг центра
    setTimeout(() => {
      if (enemyElement.parentNode && !enemyElement.classList.contains("dead")) {
        // Создаем эффект "прорыва" к центру
        this.createBreachEffect(centerX, centerY);
        this.removeEnemy(enemyElement);
      }
    }, duration);
  }

  // Новый метод для эффекта прорыва
  createBreachEffect(x, y) {
    const breach = document.createElement("div");
    breach.className = "breach-effect";
    breach.style.left = x - 25 + "px";
    breach.style.top = y - 25 + "px";
    breach.style.position = "absolute";
    breach.style.pointerEvents = "none";

    this.gameArea.appendChild(breach);

    setTimeout(() => {
      if (breach.parentNode) {
        breach.parentNode.removeChild(breach);
      }
    }, 1000);
  }

  hitEnemy(event, enemyElement) {
    event.stopPropagation();

    const enemyData = this.enemies.find((e) => e.element === enemyElement);
    if (!enemyData || enemyElement.classList.contains("dead")) return;

    enemyData.hits++;
    enemyElement.dataset.hits = enemyData.hits;

    // Создаем эффект попадания
    this.createHitEffect(event.clientX, event.clientY);

    // Добавляем звуковой эффект (визуальная обратная связь)
    enemyElement.style.transform = "scale(1.2)";
    setTimeout(() => {
      if (enemyElement.parentNode) {
        enemyElement.style.transform = "scale(1)";
      }
    }, 150);

    if (enemyData.hits === 1) {
      enemyElement.classList.add("hit");
      // Первое попадание - желтый эффект
      enemyElement.style.background =
        "radial-gradient(circle, #ffeb3b, #ffc107)";
      enemyElement.style.borderColor = "#ff9800";
    } else if (enemyData.hits === 2) {
      // Второе попадание - оранжевый эффект
      enemyElement.style.background =
        "radial-gradient(circle, #ff9800, #f57c00)";
      enemyElement.style.borderColor = "#ef6c00";
      enemyElement.style.boxShadow = "0 0 20px rgba(255, 152, 0, 0.9)";
    } else if (enemyData.hits >= 3) {
      this.destroyEnemy(enemyElement);
    }
  }

  createHitEffect(x, y) {
    // Создаем основной эффект попадания
    const effect = document.createElement("div");
    effect.className = "hit-effect";
    effect.style.left = x - 15 + "px";
    effect.style.top = y - 15 + "px";
    effect.style.position = "fixed";
    effect.style.pointerEvents = "none";

    document.body.appendChild(effect);

    // Создаем дополнительные искры
    for (let i = 0; i < 4; i++) {
      const spark = document.createElement("div");
      spark.className = "hit-spark";
      spark.style.left = x + (Math.random() - 0.5) * 20 + "px";
      spark.style.top = y + (Math.random() - 0.5) * 20 + "px";
      spark.style.position = "fixed";
      spark.style.pointerEvents = "none";

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

  destroyEnemy(enemyElement) {
    enemyElement.classList.add("dead");
    this.score++;

    // Анимация изменения счетчика
    this.scoreElement.textContent = this.score;
    this.scoreElement.style.transform = "scale(1.3)";
    this.scoreElement.style.color = "#00ff00";

    setTimeout(() => {
      this.scoreElement.style.transform = "scale(1)";
      this.scoreElement.style.color = "#ffd700";
    }, 200);

    // Создаем эффект взрыва
    this.createDeathEffect(enemyElement);

    setTimeout(() => {
      this.removeEnemy(enemyElement);
    }, 200);
  }

  createDeathEffect(enemyElement) {
    const rect = enemyElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Создаем несколько частиц
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement("div");
      particle.className = "death-particle";

      const angle = (i / 6) * 2 * Math.PI;
      const distance = 30 + Math.random() * 20;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      particle.style.left = centerX + "px";
      particle.style.top = centerY + "px";
      particle.style.position = "fixed";
      particle.style.setProperty("--dx", dx + "px");
      particle.style.setProperty("--dy", dy + "px");

      document.body.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 600);
    }
  }

  removeEnemy(enemyElement) {
    if (enemyElement.parentNode) {
      enemyElement.parentNode.removeChild(enemyElement);
    }

    const index = this.enemies.findIndex((e) => e.element === enemyElement);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }

  updateEnemies() {
    // Проверяем врагов, которые могли достичь центра
    this.enemies.forEach((enemy) => {
      const rect = enemy.element.getBoundingClientRect();
      const gameRect = this.gameArea.getBoundingClientRect();
      const centerX = gameRect.left + gameRect.width / 2;
      const centerY = gameRect.top + gameRect.height / 2;

      const distance = Math.sqrt(
        Math.pow(rect.left + rect.width / 2 - centerX, 2) +
          Math.pow(rect.top + rect.height / 2 - centerY, 2)
      );

      // Если враг очень близко к центру и не мертв
      if (distance < 50 && !enemy.element.classList.contains("dead")) {
        this.removeEnemy(enemy.element);
      }
    });
  }

  handleResize() {
    // Пересчитываем позиции при изменении размера окна
    this.enemies.forEach((enemy) => {
      if (!enemy.element.classList.contains("dead")) {
        // Останавливаем текущую анимацию и перезапускаем движение
        enemy.element.style.transition = "none";
        setTimeout(() => {
          this.moveEnemyToCenter(enemy.element);
        }, 10);
      }
    });
  }

  pauseGame() {
    this.gameRunning = false;
  }

  resumeGame() {
    this.gameRunning = true;
    this.gameLoop();
    this.spawnEnemies();
  }
}

// Инициализация игры после загрузки DOM
document.addEventListener("DOMContentLoaded", () => {
  const game = new TurretGame();

  // Глобальная переменная для управления игрой из консоли
  window.turretGame = game;
});

// Если DOM уже загружен
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.turretGame) {
      const game = new TurretGame();
      window.turretGame = game;
    }
  });
} else {
  if (!window.turretGame) {
    const game = new TurretGame();
    window.turretGame = game;
  }
}
