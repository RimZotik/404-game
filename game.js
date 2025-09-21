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

    // Добавляем обработчик клика
    enemy.addEventListener("click", (e) => this.hitEnemy(e, enemy));

    this.enemiesContainer.appendChild(enemy);
    this.enemies.push({
      element: enemy,
      startX: position.x,
      startY: position.y,
      targetX: this.gameArea.offsetWidth / 2,
      targetY: this.gameArea.offsetHeight / 2,
      startTime: Date.now(),
      hits: 0,
    });

    // Анимация движения к центру
    this.moveEnemyToCenter(enemy);
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

    // Вычисляем время движения на основе скорости
    const duration = (distance / this.enemySpeed) * 1000;

    enemyElement.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
    enemyElement.style.left = centerX + "px";
    enemyElement.style.top = centerY + "px";

    // Удаляем врага, если он достиг центра
    setTimeout(() => {
      if (enemyElement.parentNode && !enemyElement.classList.contains("dead")) {
        this.removeEnemy(enemyElement);
      }
    }, duration);
  }

  hitEnemy(event, enemyElement) {
    event.stopPropagation();

    const enemyData = this.enemies.find((e) => e.element === enemyElement);
    if (!enemyData || enemyElement.classList.contains("dead")) return;

    enemyData.hits++;
    enemyElement.dataset.hits = enemyData.hits;

    // Создаем эффект попадания
    this.createHitEffect(event.clientX, event.clientY);

    if (enemyData.hits === 1 || enemyData.hits === 2) {
      enemyElement.classList.add("hit");
    } else if (enemyData.hits >= 3) {
      this.destroyEnemy(enemyElement);
    }
  }

  createHitEffect(x, y) {
    const effect = document.createElement("div");
    effect.className = "hit-effect";
    effect.style.left = x - 10 + "px";
    effect.style.top = y - 10 + "px";
    effect.style.position = "fixed";

    document.body.appendChild(effect);

    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, 300);
  }

  destroyEnemy(enemyElement) {
    enemyElement.classList.add("dead");
    this.score++;
    this.scoreElement.textContent = this.score;

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
