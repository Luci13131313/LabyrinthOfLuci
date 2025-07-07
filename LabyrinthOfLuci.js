<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Bamboozled with Lava Walls</title>
    <script src="https://cdn.jsdelivr.net/npm/@farcade/game-sdk@latest/dist/index.min.js"></script>
    <style>
      canvas {
        width: 100%;
        height: 100%;
        max-width: 360px;
        max-height: 480px;
        background: #0d0d0d;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        object-fit: contain;
      }
      #ghost-canvas {
        display: none; /* Hidden canvas for path detection */
      }
    </style>
  </head>
  <body>
    <canvas id="gameCanvas" width="360" height="360"></canvas>
    <canvas id="ghost-canvas" width="360" height="360"></canvas>
    <script>
      // Canvas and context
      const canvas = document.getElementById("gameCanvas");
      const ctx = canvas.getContext("2d");
      const ghostCanvas = document.getElementById("ghost-canvas");
      const ghostCtx = ghostCanvas.getContext("2d", { willReadFrequently: true });
      const GRID_SIZE = 20;
      const GRID_WIDTH = 18;
      const GRID_HEIGHT = 18;
      const FPS = 60;
      const ATTACK_RANGE = 150;
      const ATTACK_SPEED = 60;
      const MOVE_COOLDOWN = 10;

      // Player object
      const player = {
        gridX: 6,
        gridY: 6,
        health: 999,
        attackRange: ATTACK_RANGE,
        attackCooldown: 0,
        moveCooldown: 0,
        image: new Image(),
        rampage: false,
        rampageTimer: 0,
        blinkTimer: 0,
        attackMultiplier: 1,
        armorMultiplier: 1,
        attackSpeedMultiplier: 1,
      };
      player.image.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/MysteryLogo.png?raw=true";

      // Game state
      let enemies = [];
      let projectiles = [];
      let score = 0;
      let wave = 1;
      const keys = Object.create(null);
      let isControlReversed = false;
      let drops = [];
      let gameTime = 0;
      let kills = 0;
      let enemyProjectiles = [];
      let spawnQueue = [];
      let enemyCounts = { rect: 0, circle: 0, triangle: 0, star: 0 };
      let gameState = "guide";
      let countdownTimer = 0;
      let countdownText = "";
      let countdownAlpha = 1;
      let countdownScale = 0.5;
      let lastTime = 0;
      let particles = [];
      let statusMessages = [];
      let deathEffects = [];
      let loadingTimer = 5;
      let currentPath = null; // Current SVG path for the wave
      let startZone = null; // Start zone coordinates
      let endZone = null; // End zone coordinates

      // SVG paths from Draw the Doodle
      const svgPaths = {
        Level1: {
            path: "M 30 50 L 50 50 L 50 70 L 30 70 L 30 90 L 50 90 L 70 90 L 70 70 L 90 70 L 110 70 L 130 70 L 150 70 L 170 70 L 190 70 L 210 70 L 230 70 L 250 70 L 270 70 L 270 90 L 250 90 L 230 90 L 210 90 L 190 90 L 170 90 L 150 90 L 130 90 L 110 90 L 90 90 L 50 110 L 30 110 L 30 130 L 50 130 L 50 150 L 30 150 L 30 170 L 50 170 L 50 190 L 30 190 L 30 210 L 50 210 L 50 230 L 30 230 L 30 250 L 50 250 L 70 250 L 70 230 L 90 230 L 110 230 L 130 230 L 150 230 L 170 230 L 190 230 L 210 230 L 230 230 L 250 230 L 270 230 L 290 230 L 290 250 L 270 250 L 250 250 L 230 250 L 210 250 L 190 250 L 170 250 L 150 250 L 130 250 L 110 250 L 90 250 L 90 290 L 70 290 L 50 290 L 50 270 L 30 270 L 30 290 L 30 310 L 50 310 L 70 310 L 90 310 L 110 310 L 110 290 L 130 290 L 150 290 L 170 290 L 190 290 L 210 290 L 230 290 L 250 290 L 270 290 L 290 290 L 310 290 L 330 290 L 330 310 L 310 310 L 290 310 L 270 310 L 250 310 L 230 310 L 210 310 L 190 310 L 170 310 L 150 310 L 130 310",
            start: { x: 30, y: 310 },
            end: { x: 270, y: 70 },
        },
        Level2: {
            path: "M 230 50 L 250 50 L 270 50 L 270 70 L 250 70 L 230 70 L 230 90 L 250 90 L 270 90 L 270 110 L 250 110 L 230 110 L 230 130 L 250 130 L 270 130 L 270 150 L 250 150 L 230 150 L 230 170 L 250 170 L 270 170 L 270 190 L 250 190 L 230 190 L 230 210 L 250 210 L 270 210 L 270 230 L 250 230 L 230 230 L 230 250 L 250 250 L 270 250 L 270 270 L 250 270 L 230 270 L 230 290 L 210 290 L 190 290 L 170 290 L 150 290 L 130 290 L 110 290 L 90 290 L 70 290 L 50 290 L 50 310 L 70 310 L 90 310 L 110 310 L 130 310 L 150 310 L 170 310 L 190 310 L 210 310 L 230 310 L 250 310 L 250 290 L 270 290 L 270 310 L 270 330 L 250 330 L 230 330 L 210 330 L 190 330 L 170 330 L 150 330 L 130 330 L 110 330 L 90 330 L 70 330 L 50 330",
          start: { x: 70, y: 320 },
          end: { x: 250, y: 70 },
        },
        Level3: {
          path: "M 130 50 L 150 50 L 170 50 L 190 50 L 210 50 L 230 50 L 250 50 L 270 50 L 290 50 L 310 50 L 310 70 L 290 70 L 270 70 L 250 70 L 230 70 L 210 70 L 190 70 L 170 70 L 150 70 L 130 70 L 130 90 L 150 90 L 170 90 L 190 90 L 210 90 L 230 90 L 250 90 L 270 90 L 290 90 L 310 90 L 310 110 L 290 110 L 270 110 L 250 110 L 230 110 L 210 110 L 190 110 L 170 110 L 150 110 L 130 110 L 130 130 L 150 130 L 170 130 L 190 130 L 210 130 L 230 130 L 250 130 L 270 130 L 290 130 L 310 130 L 210 150 L 190 150 L 170 150 L 150 150 L 130 150 L 130 170 L 150 170 L 170 170 L 190 170 L 210 170 L 210 190 L 190 190 L 170 190 L 150 190 L 130 190 L 130 210 L 150 210 L 170 210 L 190 210 L 210 210 L 210 230 L 190 230 L 170 230 L 150 230 L 130 230 L 130 250 L 150 250 L 170 250 L 190 250 L 210 250 L 210 270 L 190 270 L 170 270 L 150 270 L 130 270 L 130 290 L 150 290 L 170 290 L 190 290 L 210 290 L 210 310 L 190 310 L 170 310 L 150 310 L 130 310 L 130 330 L 150 330 L 170 330 L 190 330 L 210 330",
          start: { x: 170, y: 190 },
          end: { x: 250, y: 150 },
        },
        // Add more paths as needed
      };
      const shapes = ["Level1", "Level2", "Level3"];

      // Audio

      const soundtrack2 = new Audio("https://github.com/Luci13131313/Ktana/blob/main/assets/Bbzld2.mp3?raw=true");
      const damageSound = new Audio("https://github.com/Luci13131313/Ktana/blob/main/assets/BbzldHurt.mp3?raw=true");
      const healthSound = new Audio("https://github.com/Luci13131313/Ktana/blob/main/assets/%2B10.mp3?raw=true");
      const rampageSound = new Audio("https://github.com/Luci13131313/Ktana/blob/main/assets/Rampage.mp3?raw=true");
      const bamboozledSound = new Audio("https://github.com/Luci13131313/Ktana/blob/main/assets/Bamboozled!.mp3?raw=true");
      const thatsOKSound = new Audio("https://github.com/Luci13131313/Ktana/blob/main/assets/ThatsOK.mp3?raw=true");

      soundtrack2.isLoaded = false;
      damageSound.isLoaded = false;
      healthSound.isLoaded = false;
      rampageSound.isLoaded = false;
      bamboozledSound.isLoaded = false;
      thatsOKSound.isLoaded = false;

      soundtrack2.loop = false;

      soundtrack2.volume = 0.2;
      damageSound.volume = 0.3;
      healthSound.volume = 0.3;
      rampageSound.volume = 0.3;
      bamboozledSound.volume = 0.3;
      thatsOKSound.volume = 0.2;

      let currentSoundtrack = soundtrack2;
      let isMuted = false;

      [soundtrack2, damageSound, healthSound, rampageSound, bamboozledSound, thatsOKSound].forEach((sound) => {
        sound.oncanplaythrough = () => { sound.isLoaded = true; };
        sound.onerror = () => { sound.isLoaded = false; };
      });

      soundtrack2.addEventListener("ended", () => {
          currentSoundtrack.play();
      });

      // Joystick
      const Joystick = {
        active: false,
        startX: 0,
        startY: 0,
        dx: 0,
        dy: 0,
        touchId: null,
      };

      const Input = {
        moveX: 0,
        moveY: 0,
        attack: false,
        update: function () {
          const right = keys["d"] || keys["ArrowRight"] || false;
          const left = keys["a"] || keys["ArrowLeft"] || false;
          const down = keys["s"] || keys["ArrowDown"] || false;
          const up = keys["w"] || keys["ArrowUp"] || false;
          this.moveX = Number(right) - Number(left);
          this.moveY = Number(down) - Number(up);

          if (Joystick.active && Math.hypot(Joystick.dx, Joystick.dy) > 10 && this.moveX === 0 && this.moveY === 0) {
            this.moveX = Joystick.dx / Math.hypot(Joystick.dx, Joystick.dy);
            this.moveY = Joystick.dy / Math.hypot(Joystick.dx, Joystick.dy);
          }
          this.attack = this.moveX !== 0 || this.moveY !== 0;
        },
      };

      // Enemy types
      const enemyTypes = {
        rect: { color: "#000", shape: "rect", sizeX: 60, sizeY: 60, health: 30, speed: 0.15, attack: 30, armor: 2, attackType: "melee" },
        circle: { color: "#6A6FF3", shape: "circle", sizeX: 30, sizeY: 30, health: 10, speed: 0.3, attack: 10, armor: 1, attackType: "melee" },
        triangle: { color: "#F44336", shape: "triangle", sizeX: 20, sizeY: 20, health: 10, speed: 0.7, attack: 5, armor: 1, attackType: "melee" },
        star: { color: "#F1C500", shape: "star", sizeX: 40, sizeY: 40, health: 7, speed: 0.3, attack: 2, armor: 5, attackType: "ranged" },
      };

      // Images
      const rectEnemyImage = new Image();
      rectEnemyImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/FarBlack.png?raw=true";
      const starEnemyImage = new Image();
      starEnemyImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/FarYellow.png?raw=true";
      const circleEnemyImage = new Image();
      circleEnemyImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/FarBlue.png?raw=true";
      const triangleEnemyImage = new Image();
      triangleEnemyImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/FarRed%20(1).png?raw=true";
      const deadImage = new Image();
      deadImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/FarDead%20(1).png?raw=true";
      const heartImage = new Image();
      heartImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/PotYellow.png?raw=true";
      const muscleImage = new Image();
      muscleImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/PotBlue.png?raw=true";
      const potionImage = new Image();
      potionImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/PotPurple.png?raw=true";
      const randomImage = new Image();
      randomImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/PotRed.png?raw=true";
      const logoImage = new Image();
      logoImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/images/MysteryLogo.png?raw=true";

      // Drop types
      const dropTypes = {
        heart: {
          image: heartImage,
          color: "yellow",
          effect: () => {
            player.health = Math.min(100, player.health + 10);
            statusMessages.push({ text: "+10", x: player.gridX * GRID_SIZE + GRID_SIZE, y: player.gridY * GRID_SIZE - 10, color: "green", duration: 1, alpha: 1 });
            if (!isMuted && healthSound.isLoaded) healthSound.play();
          },
          chance: 0.05,
        },
        muscle: {
          image: muscleImage,
          color: "blue",
          effect: () => {
            player.rampage = true;
            player.rampageTimer = 5;
            player.attackMultiplier = 5;
            player.armorMultiplier = 5;
            player.attackSpeedMultiplier = 5;
            statusMessages.push({ text: "Rampage", x: canvas.width / 2, y: canvas.height / 2, color: "red", duration: 5, alpha: 1, blink: true });
            if (!isMuted && rampageSound.isLoaded) rampageSound.play();
          },
          chance: 0.005,
        },
        potion: {
          image: potionImage,
          color: "purple",
          effect: () => {
            isControlReversed = !isControlReversed;
            const message = isControlReversed
              ? { text: "Bamboozled!", x: canvas.width / 2, y: canvas.height / 2, color: "multicolor", duration: 1, alpha: 1 }
              : { text: "That's OK", x: canvas.width / 2, y: canvas.height / 2, color: "green", duration: 1, alpha: 1 };
            statusMessages.push(message);
            if (!isMuted) {
              if (isControlReversed && bamboozledSound.isLoaded) bamboozledSound.play();
              else if (!isControlReversed && thatsOKSound.isLoaded) thatsOKSound.play();
            }
          },
          chance: 0.01,
        },
        random: {
          image: randomImage,
          color: "red",
          effect: () => {
            const types = ["heart", "muscle", "potion"];
            const selectedType = types[Math.floor(Math.random() * types.length)];
            dropTypes[selectedType].effect();
            drops.find((d) => d.type === "random").color = dropTypes[selectedType].color;
          },
          chance: 0.02,
        },
      };

      // Draw SVG path
      function drawGhostPath(shape) {
        ghostCtx.clearRect(0, 0, canvas.width, canvas.height);
        const lavaImage = new Image();
        lavaImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/Lava.png?raw=true";
        const pattern = ctx.createPattern(lavaImage, "repeat");
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const data = svgPaths[shape];
        if (!data) return;

        ghostCtx.strokeStyle = "#aaa";
        ghostCtx.lineWidth = 24;
        ghostCtx.lineCap = "round";
        ghostCtx.lineJoin = "round";
        const path = new Path2D(data.path);
        ghostCtx.stroke(path);

        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 24;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(path);

        // Verify start and end zones are on path
        if (!isOnPath(data.start.x, data.start.y) || !isOnPath(data.end.x, data.end.y)) {
            console.warn(`Shape ${shape} has invalid start/end zones!`);
            return; // Skip invalid path
        }

        // Draw start and end zones
        ctx.beginPath();
        ctx.fillStyle = "green"; // Start zone
        ctx.arc(data.start.x, data.start.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "blue"; // End zone
        ctx.arc(data.end.x, data.end.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Set global zones
        startZone = data.start;
        endZone = data.end;
        }

      // Check if position is on path
      function isOnPath(x, y) {
  // Check a 3x3 area around (x, y) for more tolerance
  const offsets = [-1, 0, 1]; // Check neighboring pixels
  for (let dx of offsets) {
    for (let dy of offsets) {
      const pixelX = Math.floor(x + dx);
      const pixelY = Math.floor(y + dy);
      // Ensure pixel is within canvas bounds
      if (pixelX >= 0 && pixelX < canvas.width && pixelY >= 0 && pixelY < canvas.height) {
        const pixel = ghostCtx.getImageData(pixelX, pixelY, 1, 1).data;
        const r = pixel[0], g = pixel[1], b = pixel[2];
        if (Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && r >= 80 && r <= 220) {
          return true; // If any pixel in the 3x3 area is valid, return true
        }
      }
    }
  }
  return false; // No valid pixel found
}

      // Spawn wave
      function spawnWave(wave) {
        enemies = []; // Clear enemies for new wave
        spawnQueue = [];
        enemyCounts = { rect: 0, circle: 0, triangle: 0, star: 0 };
        Object.keys(enemyTypes).forEach((type) => {
            for (let i = 0; i < wave; i++) {
            spawnQueue.push({ type, delay: i * 30 });
            }
        });

        currentPath = shapes[(wave - 1) % shapes.length];
        drawGhostPath(currentPath);

        // Place player on start zone
        const pathData = svgPaths[currentPath];
        const startX = pathData.start.x;
        const startY = pathData.start.y;
        if (isOnPath(startX, startY)) {
        player.gridX = Math.floor(startX / GRID_SIZE);
        player.gridY = Math.floor(startY / GRID_SIZE);
        } else {
        console.warn(`Start zone for ${currentPath} is not on path!`);
        player.gridX = 6; // Fallback to center
        player.gridY = 6;
        }
    }

      // Reset game
      function resetGame() {
        currentPath = shapes[0]; // First wave uses first shape
        const pathData = svgPaths[currentPath];
        player.gridX = Math.floor(pathData.start.x / GRID_SIZE);
        player.gridY = Math.floor(pathData.start.y / GRID_SIZE);
        player.health = 999;
        player.attackCooldown = 0;
        player.moveCooldown = 0;
        wave = 1;
        projectiles = [];
        score = 0;
        drops = [];
        gameTime = 0;
        kills = 0;
        enemyProjectiles = [];
        spawnQueue = [];
        enemyCounts = { rect: 0, circle: 0, triangle: 0, star: 0 };
        player.rampage = false;
        player.rampageTimer = 0;
        player.blinkTimer = 0;
        isControlReversed = false;
        gameState = "guide";
        countdownTimer = 0;
        countdownText = "";
        countdownAlpha = 1;
        countdownScale = 0.5;
        particles = [];
        statusMessages = [];
        deathEffects = [];
        loadingTimer = 5;
        if (!isMuted) {
  
          soundtrack2.pause();
          currentSoundtrack = soundtrack2;
          currentSoundtrack.currentTime = 0;
        }
        spawnWave(wave);
        window.FarcadeSDK.singlePlayer.actions.ready();
      }

      // Draw grid (debugging)
      function drawGrid() {
        ctx.strokeStyle = "#CCCCCC";
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Draw player
      function drawPlayer() {
        ctx.save();
        if (player.blinkTimer > 0) {
          player.blinkTimer--;
          ctx.globalAlpha = Math.sin(player.blinkTimer * 0.2) * 0.5 + 0.5;
        }
        if (player.rampage) {
          ctx.fillStyle = `hsl(${((Date.now() % 1000) / 1000) * 360}, 100%, 50%)`;
          ctx.shadowBlur = 20;
          ctx.shadowColor = ctx.fillStyle;
          ctx.beginPath();
          ctx.arc(player.gridX * GRID_SIZE + GRID_SIZE, player.gridY * GRID_SIZE + GRID_SIZE, 25, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.translate(player.gridX * GRID_SIZE + GRID_SIZE, player.gridY * GRID_SIZE + GRID_SIZE);
        ctx.drawImage(player.image, -10, -10, 20, 20);
        ctx.restore();

        // Health bar
        ctx.save();
        ctx.globalAlpha = 1;
        const healthRatio = player.health / player.maxHealth;
        const radius = player.sizeX / 3;
        ctx.strokeStyle =
        healthRatio > 0.75 ? "#006400" : healthRatio > 0.5 ? "#90EE90" : healthRatio > 0.25 ? "#FFFF00" : "#FF0000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * healthRatio);
        ctx.stroke();
      }

      // Draw enemies
      function drawEnemies() {
        enemies.forEach((enemy) => {
          if (enemy.fadeFrames > 0) {
            enemy.fadeOpacity -= 1 / 30;
            enemy.fadeFrames--;
            if (enemy.fadeFrames === 0) {
              score += 10;
              kills++;
              const rand = Math.random();
              let dropChance = 0;
              for (const [type, config] of Object.entries(dropTypes)) {
                dropChance += config.chance;
                if (rand < dropChance) {
                  drops.push({ type, gridX: enemy.gridX, gridY: enemy.gridY, spawnTime: Date.now(), ...config });
                  break;
                }
              }
              const deathRoll = Math.random();
              let deathType = "fade";
              if (deathRoll < 0.33) deathType = "deadImage";
              else if (deathRoll < 0.66) deathType = "explode";
              if (deathType === "deadImage") {
                deathEffects.push({ type: "deadImage", x: enemy.x, y: enemy.y, opacity: 1, vy: -1, duration: 60 });
              } else if (deathType === "explode") {
                for (let i = 0; i < Math.floor(Math.random() * 4) + 6; i++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = Math.random() * 2 + 1;
                  deathEffects.push({
                    type: "explode",
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 10,
                    opacity: 1,
                    duration: 15,
                    color: enemy.color,
                  });
                }
              }
              enemyCounts[enemy.enemyType]--;
              enemies = enemies.filter((e) => e !== enemy);
              return;
            }
          }
          ctx.save();
          ctx.globalAlpha = enemy.fadeOpacity;
          ctx.translate(enemy.x, enemy.y);
          ctx.fillStyle = enemy.color;
          if (enemy.shape === "rect") {
            ctx.drawImage(rectEnemyImage, -enemy.sizeX / 2, -enemy.sizeY / 2, enemy.sizeX, enemy.sizeY);
          } else if (enemy.shape === "circle") {
            ctx.drawImage(circleEnemyImage, -enemy.sizeX / 2, -enemy.sizeY / 2, enemy.sizeX, enemy.sizeY);
          } else if (enemy.shape === "triangle") {
            ctx.drawImage(triangleEnemyImage, -enemy.sizeX / 2, -enemy.sizeY / 2, enemy.sizeX, enemy.sizeY);
          } else if (enemy.shape === "star") {
            ctx.drawImage(starEnemyImage, -enemy.sizeX / 2, -enemy.sizeY / 2, enemy.sizeX, enemy.sizeY);
          }
          ctx.restore();

          // Health ring
          ctx.save();
        ctx.globalAlpha = 1;
        const healthRatio = enemy.health / enemy.maxHealth;
        const radius = enemy.sizeX / 2.5;
        ctx.strokeStyle =
        healthRatio > 0.75 ? "#006400" : healthRatio > 0.5 ? "#90EE90" : healthRatio > 0.25 ? "#FFFF00" : "#FF0000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * healthRatio);
        ctx.stroke();
        });
      }

      // Draw projectiles
      function drawProjectiles() {
        projectiles.forEach((p) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.drawImage(player.image, -10, -10, 20, 20);
          ctx.restore();
        });

        enemyProjectiles.forEach((p) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.drawImage(starEnemyImage, -10, -10, 20, 20);
          ctx.restore();
        });
      }

      // Update player
      function updatePlayer() {
        if (player.moveCooldown > 0) player.moveCooldown--;
        if (player.moveCooldown > 0) return;

        Input.update();
        let newX = player.gridX;
        let newY = player.gridY;

        if (!isNaN(Input.moveX) && !isNaN(Input.moveY)) {
          if (Math.abs(Input.moveX) >= 0.9) {
            newX += isControlReversed ? -Math.sign(Input.moveX) : Math.sign(Input.moveX);
          }
          if (Math.abs(Input.moveY) >= 0.9) {
            newY += isControlReversed ? -Math.sign(Input.moveY) : Math.sign(Input.moveY);
          }
          if (Math.abs(Input.moveX) > 0.1 && Math.abs(Input.moveX) < 0.9) {
            newX += isControlReversed ? -Math.sign(Input.moveX) : Math.sign(Input.moveX);
          }
          if (Math.abs(Input.moveY) > 0.1 && Math.abs(Input.moveY) < 0.9) {
            newY += isControlReversed ? -Math.sign(Input.moveY) : Math.sign(Input.moveY);
          }
        }

        // Edge wrapping
        if (newX < 0) newX = GRID_WIDTH - 2;
        if (newX > GRID_WIDTH - 2) newX = 0;
        if (newY < 0) newY = GRID_HEIGHT - 2;
        if (newY > GRID_HEIGHT - 2) newY = 0;

        // Check if new position is on path
        const newPixelX = newX * GRID_SIZE + GRID_SIZE / 2;
        const newPixelY = newY * GRID_SIZE + GRID_SIZE / 2;
        if (isOnPath(newPixelX, newPixelY)) {
          player.gridX = newX;
          player.gridY = newY;
          player.moveCooldown = MOVE_COOLDOWN;
          window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
        } else if (newX !== player.gridX || newY !== player.gridY) {
          // Touching lava walls
          player.health -= 10; // Decrease health by 10
          player.blinkTimer = 30; // Blink effect
          if (!isMuted && damageSound.isLoaded) damageSound.play(); // Play damage sound
          statusMessages.push({
            text: "-10",
            x: player.gridX * GRID_SIZE + GRID_SIZE,
            y: player.gridY * GRID_SIZE - 10,
            color: "red",
            duration: 1,
            alpha: 1
          }); // Show damage text
          window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
          if (player.health <= 0) {
            gameState = "gameOver";
            window.FarcadeSDK.singlePlayer.actions.gameOver({ score });
          }
        }

        // Attack
        if (Input.attack && player.attackCooldown <= 0) {
          const nearestEnemy = findNearestEnemy();
          if (nearestEnemy) {
            const px = player.gridX * GRID_SIZE + GRID_SIZE;
            const py = player.gridY * GRID_SIZE + GRID_SIZE;
            const dx = [nearestEnemy.x - px, nearestEnemy.x - canvas.width - px, nearestEnemy.x + canvas.width - px].reduce(
              (a, b) => (Math.abs(a) < Math.abs(b) ? a : b)
            );
            const dy = [nearestEnemy.y - py, nearestEnemy.y - canvas.height - py, nearestEnemy.y + canvas.height - py].reduce(
              (a, b) => (Math.abs(a) < Math.abs(b) ? a : b)
            );
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              const speed = 4;
              const vx = (dx / dist) * speed;
              const vy = (dy / dist) * speed;
              projectiles.push({ x: px, y: py, vx, vy, rotation: 0 });
              player.attackCooldown = ATTACK_SPEED / player.attackSpeedMultiplier;
              window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
            }
          } else {
            window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
          }
        }
      }

      // Update enemies
      function updateEnemies() {
        const playerCenterX = player.gridX * GRID_SIZE + GRID_SIZE;
        const playerCenterY = player.gridY * GRID_SIZE + GRID_SIZE;
        enemies.forEach((enemy) => {
          if (enemy.fadeFrames > 0) return;
          if (enemy.attackCooldown > 0) enemy.attackCooldown--;

          // Melee attack
          if (enemy.attackType === "melee" && enemy.attackCooldown === 0) {
            const playerCells = [
              { x: player.gridX, y: player.gridY },
              { x: player.gridX + 1, y: player.gridY },
              { x: player.gridX, y: player.gridY + 1 },
              { x: player.gridX + 1, y: player.gridY + 1 },
            ];
            for (const cell of playerCells) {
              if (enemy.gridX === cell.x && enemy.gridY === cell.y) {
                const damage = Math.max(0, enemy.attack - (player.rampage ? 1 * player.armorMultiplier : 1));
                player.health -= damage;
                player.blinkTimer = 30;
                if (!isMuted && damageSound.isLoaded) damageSound.play();
                enemy.attackCooldown = FPS;
                window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
                break;
              }
            }
          }

          // Ranged attack
          if (enemy.attackType === "ranged" && enemy.attackCooldown <= 0) {
            const dx = playerCenterX - enemy.x;
            const dy = playerCenterY - enemy.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= 180) {
              const speed = 3;
              const vx = (dx / dist) * speed;
              const vy = (dy / dist) * speed;
              enemyProjectiles.push({ x: enemy.x, y: enemy.y, vx, vy, rotation: 0, startX: enemy.x, startY: enemy.y });
              enemy.attackCooldown = FPS;
              window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
            }
          }

          // Movement
          const dx = playerCenterX - enemy.x;
          const dy = playerCenterY - enemy.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
            if (enemy.x < 0) enemy.x += canvas.width;
            if (enemy.x > canvas.width) enemy.x -= canvas.width;
            if (enemy.y < 0) enemy.y += canvas.height;
            if (enemy.y > canvas.height) enemy.y -= canvas.height;
            enemy.gridX = Math.floor(enemy.x / GRID_SIZE);
            enemy.gridY = Math.floor(enemy.y / GRID_SIZE);
          }

          // Collision avoidance
          enemies.forEach((other) => {
            if (other === enemy || other.fadeFrames > 0) return;
            const dx2 = [other.x - enemy.x, other.x - canvas.width - enemy.x, other.x + canvas.width - enemy.x].reduce(
              (a, b) => (Math.abs(a) < Math.abs(b) ? a : b)
            );
            const dy2 = [other.y - enemy.y, other.y - canvas.height - enemy.y, other.y + canvas.height - enemy.y].reduce(
              (a, b) => (Math.abs(a) < Math.abs(b) ? a : b)
            );
            const dist2 = Math.hypot(dx2, dy2);
            if (dist2 < GRID_SIZE && dist2 > 0) {
              const push = (GRID_SIZE - dist2) / 2;
              enemy.x -= (dx2 / dist2) * push;
              enemy.y -= (dy2 / dist2) * push;
              other.x += (dx2 / dist2) * push;
              other.y += (dy2 / dist2) * push;
            }
          });
        });
      }

      // Update game
      function update(deltaTime) {
        if (gameState === "guide") {
          if (!isMuted && currentSoundtrack.playing) {
            currentSoundtrack.pause();
          }
          loadingTimer = Math.max(0, loadingTimer - deltaTime);
          return;
        }
        if (gameState === "gameOver") {
          return;
        }
        if (gameState === "countdown") {
          if (!isMuted && currentSoundtrack.isLoaded && !currentSoundtrack.playing) {
            currentSoundtrack.play();
          }
          countdownTimer -= deltaTime;
          countdownAlpha -= deltaTime / 3;
          countdownScale += deltaTime / 1.5;
          if (countdownTimer <= 2.25) countdownText = "2";
          if (countdownTimer <= 1.5) countdownText = "1";
          if (countdownTimer <= 0.75) countdownText = "GO!";
          if (countdownTimer <= 0) {
            gameState = "playing";
            countdownTimer = 0;
          }
          return;
        }
        if (player.health <= 0) {
          window.FarcadeSDK.singlePlayer.actions.gameOver({ score });
          gameState = "gameOver";
          return;
        }

        // Update projectiles
        projectiles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += (Math.PI * 2) / 16;
          const px = player.gridX * GRID_SIZE + GRID_SIZE;
          const py = player.gridY * GRID_SIZE + GRID_SIZE;
          if (Math.hypot(p.x - px, p.y - py) > ATTACK_RANGE) {
            projectiles = projectiles.filter((proj) => proj !== p);
            return;
          }
          enemies.forEach((enemy) => {
            if (enemy.fadeFrames > 0) return;
            const dx = [p.x - enemy.x, p.x - canvas.width - enemy.x, p.x + canvas.width - enemy.x].reduce(
              (a, b) => Math.abs(a) < Math.abs(b) ? a : b
            );
            const dy = [p.y - enemy.y, p.y - canvas.height - enemy.y, p.y + canvas.height - enemy.y].reduce(
              (a, b) => Math.abs(a) < Math.abs(b) ? a : b
            );
            if (Math.hypot(dx, dy) < GRID_SIZE / 2) {
              const damage = Math.max(0, (player.rampage ? 12 * player.attackMultiplier : 12) - enemy.armor);
              enemy.health -= damage;
              if (enemy.health <= 0) {
                enemy.fadeFrames = 30;
              }
              for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                particles.push({
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: 4,
                  color: "white",
                  duration: 1,
                  alpha: 1,
                });
              }
              projectiles = projectiles.filter((proj) => proj !== p);
              window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
            }
          });
        });

        // Spawn queue
        spawnQueue = spawnQueue.filter((item) => {
          item.delay--;
          if (item.delay <= 0 && enemies.length < 20 && enemyCounts[item.type] < 5) {
            const edges = [
              { x: () => Math.random() * canvas.width, y: () => 0 },
              { x: () => Math.random() * canvas.width, y: () => canvas.height },
              { x: () => 0, y: () => Math.random() * canvas.height },
              { x: () => canvas.width, y: () => Math.random() * canvas.height },
            ];
            const edge = edges[Math.floor(Math.random() * 4)];
            const x = edge.x();
            const y = edge.y();
            enemies.push({
              type: "enemy",
              enemyType: item.type,
              gridX: Math.floor(x / GRID_SIZE),
              gridY: Math.floor(y / GRID_SIZE),
              x: x,
              y: y,
              ...enemyTypes[item.type],
              maxHealth: enemyTypes[item.type].health,
              fadeOpacity: 1,
              fadeFrames: 0,
              attackCooldown: 0,
            });
            enemyCounts[item.type]++;
            return false;
          }
          return true;
        });

        // New wave when reaching end zone
        if (gameState === "playing" && endZone) {
          const playerX = player.gridX * GRID_SIZE + GRID_SIZE / 2;
          const playerY = player.gridY * GRID_SIZE + GRID_SIZE / 2;
          const distToEnd = Math.hypot(playerX - endZone.x, playerY - endZone.y);
          if (distToEnd < 12) { // Within end zone radius
            gameState = "countdown";
            countdownTimer = 3;
            countdownText = `Wave ${wave + 1} in 3`;
            countdownAlpha = 1;
            countdownScale = 0.5;
            wave++;
            score += 50; // Bonus for reaching end zone
            spawnWave(wave);
            if (wave > 1) isControlReversed = !isControlReversed;
          }
        }

        // Update attack cooldown
        if (player.attackCooldown > 0) player.attackCooldown--;

        // Update player
        updatePlayer();

        // Update enemy projectiles
        enemyProjectiles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += (Math.PI * 2) / 16;
          if (Math.hypot(p.x - p.startX, p.y - p.startY) > 180) {
            enemyProjectiles = projectiles.filter((proj) => proj !== p);
            return;
          }
          const px = player.gridX * GRID_SIZE + GRID_SIZE;
          const py = player.gridY * GRID_SIZE + GRID_SIZE;
          if (Math.hypot(p.x - px, p.y - py) < GRID_SIZE / 2) {
            const damage = Math.max(0, 2 - (player.rampage ? 1 * player.armorMultiplier : 1));
            player.health -= damage;
            player.blinkTimer = 30;
            if (!isMuted && damageSound.isLoaded) damageSound.play();
            enemyProjectiles = enemyProjectiles.filter((proj) => proj !== p);
            window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
          }
        });

        // Update enemies
        updateEnemies();

        // Collect drops
        drops = drops.filter((drop) => {
          const playerCells = [
            { x: player.gridX, y: player.gridY },
            { x: player.gridX + 1, y: player.gridY },
            { x: player.gridX, y: player.gridY + 1 },
            { x: player.gridX + 1, y: player.gridY + 1 },
          ];
          for (const cell of playerCells) {
            if (drop.gridX === cell.x && drop.gridY === cell.y) {
              drop.effect();
              for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                particles.push({
                  x: drop.gridX * GRID_SIZE + GRID_SIZE / 2,
                  y: drop.gridY * GRID_SIZE + GRID_SIZE / 2,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: 6,
                  color: drop.color,
                  duration: 0.5,
                  alpha: 1,
                });
              }
              window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
              return false;
            }
          }
          return true;
        });

        // Update rampage
        if (player.rampage) {
          player.rampageTimer -= deltaTime;
          if (player.rampageTimer <= 0) {
            player.rampage = false;
            player.attackMultiplier = 1;
            player.armorMultiplier = 1;
            player.attackSpeedMultiplier = 1;
          }
        }

        // Update particles
        particles = particles.filter((p) => {
          p.x += p.vx * deltaTime * FPS;
          p.y += p.vy * deltaTime * FPS;
          p.duration -= deltaTime;
          p.alpha = p.duration / (p.color === "white" ? 1 : 0.5);
          return p.duration > 0;
        });

        deathEffects = deathEffects.filter((effect) => {
          effect.duration--;
          effect.opacity = effect.duration / 45;
          if (effect.type === "deadImage") {
            effect.y += effect.vy;
          } else if (effect.type === "explode") {
            effect.x += effect.vx;
            effect.y += effect.vy;
          }
          return effect.duration > 0;
        });

        // Update status messages
        statusMessages = statusMessages.filter((m) => {
          m.duration -= deltaTime;
          if (m.blink) m.alpha = Math.sin(Date.now() / 100) * 0.5 + 0.5;
          else m.alpha = m.duration / (m.duration < 1 ? 1 : 5);
          return m.duration > 0;
        });

        gameTime += deltaTime;
      }

      // Render
      function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGhostPath(currentPath); // Redraw path
        drawGrid();
        drawPlayer();
        drawEnemies();
        drawProjectiles();

        // Draw drops
        drops.forEach((drop) => {
          ctx.save();
          ctx.translate(drop.gridX * GRID_SIZE + GRID_SIZE / 2, drop.gridY * GRID_SIZE + GRID_SIZE / 2);
          const scale = 1.6 + Math.sin((Date.now() - drop.spawnTime) / 500) * 0.2;
          ctx.scale(scale, scale);
          ctx.shadowBlur = 15 * scale;
          ctx.shadowColor = drop.color;
          ctx.drawImage(drop.image, -15 / scale, -15 / scale, 30 / scale, 30 / scale);
          ctx.shadowBlur = 0;
          ctx.restore();
        });

        // Draw particles
        particles.forEach((p) => {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.restore();
        });

        deathEffects.forEach((effect) => {
          ctx.save();
          ctx.globalAlpha = effect.opacity;
          if (effect.type === "deadImage") {
            ctx.translate(effect.x, effect.y);
            ctx.drawImage(deadImage, -20, -20, 40, 40);
          } else if (effect.type === "explode") {
            ctx.fillStyle = effect.color;
            ctx.fillRect(effect.x - effect.size / 2, effect.y - effect.size / 2, effect.size, effect.size);
          }
          ctx.restore();
        });

        // Draw status messages
        statusMessages.forEach((m) => {
          ctx.save();
          ctx.globalAlpha = m.alpha;
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.fillStyle = m.color === "multicolor" ? `hsl(${((Date.now() % 1000) / 1000) * 360}, 100%, 50%)` : m.color;
          ctx.fillText(m.text, m.x, m.y);
          ctx.restore();
        });

        // Start screen
        if (gameState === "guide") {
          ctx.save();
          ctx.fillStyle = "#C4FF00";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = 0.7 + Math.sin(Date.now() / 1000) * 0.05;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(scale, scale);
          ctx.drawImage(logoImage, -100, -100, 200, 200);
          ctx.restore();
          ctx.fillStyle = "black";
          ctx.font = "36px Arial";
          ctx.textAlign = "center";
          ctx.fillText("Bamboozled", 180, 80);
          ctx.fillStyle = "black";
          ctx.font = "16px Arial";
          ctx.fillText("Survive on the path! Avoid lava walls!", 180, 280);
          ctx.save();
          if (loadingTimer > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(140, 235, 100, 10);
            ctx.fillStyle = "#C4FF00";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "black";
            ctx.fillRect(140, 235, (1 - loadingTimer / 5) * 100, 10);
            ctx.shadowBlur = 0;
          } else {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500) * 0.5;
            ctx.fillText("Tap to Start", 180, 320);
          }
          ctx.restore();
        }

        // Countdown
        if (gameState === "countdown") {
          ctx.save();
          ctx.globalAlpha = countdownAlpha;
          ctx.fillStyle = "red";
          ctx.font = `${20 * countdownScale}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText(countdownText, canvas.width / 2, canvas.height / 2);
          ctx.restore();
        }

        // Joystick
        if (Joystick.active) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(Joystick.startX, Joystick.startY, 30, 0, Math.PI * 2);
          ctx.fillStyle = "gray";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(Joystick.startX + Joystick.dx, Joystick.startY + Joystick.dy, 15, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();
          ctx.restore();
        }

        // UI
        ctx.save();
        ctx.fillStyle = "#C4FF00";
        ctx.font = "16px Arial";
        ctx.fillText(
          `${Math.floor(gameTime / 60).toString().padStart(2, "0")}:${Math.floor(gameTime % 60).toString().padStart(2, "0")}`,
          10,
          30
        );
        ctx.textAlign = "right";
        ctx.fillText(`K: ${kills}`, canvas.width - 10, 30);
        ctx.fillText(`W: ${wave}`, canvas.width - 10, canvas.height - 10);
        ctx.restore();
      }

      // Game loop
      function gameLoop(currentTime) {
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        update(deltaTime);
        render();
        requestAnimationFrame(gameLoop);
      }

      // Find nearest enemy
      function findNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        const px = player.gridX * GRID_SIZE + GRID_SIZE;
        const py = player.gridY * GRID_SIZE + GRID_SIZE;
        enemies.forEach((enemy) => {
          if (enemy.fadeFrames > 0) return;
          const dx = [px - enemy.x, px - canvas.width - enemy.x, px + canvas.width - enemy.x].reduce(
            (a, b) => Math.abs(a) < Math.abs(b) ? a : b
          );
          const dy = [py - enemy.y, py - canvas.height - enemy.y, py + canvas.height - enemy.y].reduce(
            (a, b) => Math.abs(a) < Math.abs(b) ? a : b
          );
          const dist = Math.hypot(dx, dy);
          if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
          }
        });
        return nearest;
      }

      // Input handlers
      canvas.addEventListener("click", () => {
        if (gameState === "guide" && loadingTimer <= 0) {
          gameState = "countdown";
          countdownTimer = 3;
          countdownText = `First Wave in 3`;
          countdownAlpha = 1;
          countdownScale = 0.5;
        }
      });

      canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (gameState === "guide" && loadingTimer <= 0) {
          gameState = "countdown";
          countdownTimer = 3;
          countdownText = `First Wave in 3`;
          countdownAlpha = 1;
          countdownScale = 0.5;
        }
        if (!Joystick.active) {
          const touchEvent = e.changedTouches[0];
          const rect = canvas.getBoundingClientRect();
          Joystick.active = true;
          Joystick.startX = touchEvent.clientX - rect.left;
          Joystick.startY = touchEvent.clientY - rect.top;
          Joystick.dx = 0;
          Joystick.dy = 0;
          Joystick.touchId = touchEvent.identifier;
          window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
        }
      });

      canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        for (let touchEvent of e.changedTouches) {
          if (touchEvent.identifier === Joystick.touchId) {
            const rect = canvas.getBoundingClientRect();
            const newX = touchEvent.clientX - rect.left;
            const newY = touchEvent.clientY - rect.top;
            const dist = Math.hypot(newX - Joystick.startX, newY - Joystick.startY);
            if (dist > 30) {
              const angle = Math.atan2(newY - Joystick.startY, newX - Joystick.startX);
              Joystick.dx = Math.cos(angle) * 30;
              Joystick.dy = Math.sin(angle) * 30;
            } else {
              Joystick.dx = newX - Joystick.startX;
              Joystick.dy = newY - Joystick.startY;
            }
          }
        }
      });

      canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        for (let touchEvent of e.changedTouches) {
          if (touchEvent.identifier === Joystick.touchId) {
            Joystick.active = false;
            Joystick.dx = 0;
            Joystick.dy = 0;
            Joystick.touchId = null;
            window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
          }
        }
      });

      window.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;
      });

      window.addEventListener("keyup", (e) => {
        const key = e.key.toLowerCase();
        keys[key] = false;
      });

      // Farcade handlers
      window.FarcadeSDK.on("play_again", () => {
        resetGame();
      });

      window.FarcadeSDK.on("toggle_mute", (data) => {
        isMuted = data.isMuted;
        if (isMuted) {
          soundtrack2.pause();
        } else if (gameState !== "guide" && currentSoundtrack.isLoaded) {
          currentSoundtrack.play();
        }
      });

      // Load assets
      Promise.all([
        new Promise((resolve) => { player.image.onload = resolve; }),
        new Promise((resolve) => { rectEnemyImage.onload = resolve; }),
        new Promise((resolve) => { starEnemyImage.onload = resolve; }),
        new Promise((resolve) => { circleEnemyImage.onload = resolve; }),
        new Promise((resolve) => { triangleEnemyImage.onload = resolve; }),
        new Promise((resolve) => { heartImage.onload = resolve; }),
        new Promise((resolve) => { muscleImage.onload = resolve; }),
        new Promise((resolve) => { potionImage.onload = resolve; }),
        new Promise((resolve) => { randomImage.onload = resolve; }),
        new Promise((resolve) => { logoImage.onload = resolve; }),
        new Promise((resolve) => { deadImage.onload = resolve; }),
        new Promise((resolve) => {
        const lavaImage = new Image();
        lavaImage.src = "https://github.com/Luci13131313/Ktana/blob/main/assets/Lava.png?raw=true";
        lavaImage.onload = resolve;
    }),
      ]).then(() => {
        resetGame();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
      });
    </script>
  </body>
</html>
