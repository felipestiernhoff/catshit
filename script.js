function loadImages(imagePaths) {
  return Promise.all(imagePaths.map(path => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        console.log(`Image loaded: ${path}`);
      resolve(img);
      img.onerror = reject;
      img.src = path;
    });
  }));
}

function loadHeartImage(heartPath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`Heart image loaded: ${heartPath}`);
      resolve(img);
    };
    img.onerror = () => {
      console.error('Failed to load heart image');
      reject(new Error(`Failed to load image at path: ${heartPath}`));
    };
    img.src = heartPath;
  });
}

class BackgroundLayer {
  constructor(ctx, image, speed, height = ctx.canvas.height) {
    this.ctx = ctx;
    this.image = image;
    this.speed = speed;
    this.x = 0;
    this.width = image.width;
    this.height = height;
  }

  update() {
    // Move the layer
    this.x -= this.speed;
    // Reset the layer position to create a loop
    if (this.x <= -this.width) {
      this.x = 0;
    }
  }

  draw() {
    // Draw the image twice for the loop
    this.ctx.drawImage(this.image, this.x, 0, this.width, this.height);
    this.ctx.drawImage(this.image, this.x + this.width, 0, this.width, this.height);
  }

}

// ... Keep the rest of the classes and functions as they were ...

class Game {
  constructor(ctx, layers, obstacleImages) {
    this.ctx = ctx;
    this.layers = layers;
    this.isRunning = false;
    this.animationFrameId = null;
    // Obstacles
    this.obstacles = [];
    this.obstacleTimeout = null;
    this.obstacleImages = obstacleImages;
    // Score & Timer
    this.score = 0;
    this.startTime = null;
    this.elapsedTime = 0;

    canvas.addEventListener('click', (event) => {
      if (this.gameOver) {
        this.handleGameOverClick(event);
      }
    });

  }

  drawScoreAndLives() {
    if (!this.gameOver) {
      // Score text
      this.ctx.font = '20px gameFont';
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(`Score: ${this.score}`, 10, 30); // Position top-left


      this.drawLives()
    }
  }

  drawLives() {
    // Assuming you have a heart image loaded in this.heartImage
    const heartWidth = 30; // Width of the heart image
    const heartHeight = 30; // Height of the heart image
    const spacing = 5; // Space between hearts
    for (let i = 0; i < this.cat.lives; i++) {
      // Draw the heart image with a defined width and height
      // Calculate the x position to include spacing
      this.ctx.drawImage(this.heartImage, 200 + (i * (heartWidth + spacing)), 10, heartWidth, heartHeight);
    }
  }

  // Method to add an obstacle
  addObstacle() {
    const image = this.obstacleImages[Math.floor(Math.random() * this.obstacleImages.length)];
    const scale = 1; // Example scale
    const obstacleX = this.ctx.canvas.width;
    const obstacleY = this.ctx.canvas.height - image.height * scale;

    const obstacle = new Obstacle(this.ctx, image, obstacleX, obstacleY, scale);
    this.obstacles.push(obstacle);
  }

  // Schedule the next obstacle
  scheduleNextObstacle() {
    if (!this.isRunning) return;

    const minInterval = 2000; // Minimum interval in milliseconds (2 seconds)
    const maxInterval = 5000; // Maximum interval in milliseconds (5 seconds)
    const interval = Math.random() * (maxInterval - minInterval) + minInterval;

    this.obstacleTimeout = setTimeout(() => {
      this.addObstacle();
      this.scheduleNextObstacle(); // Schedule the next one
    }, interval);
  }

  checkCollisions() {
    this.obstacles.forEach(obstacle => {
      if (this.isColliding(this.cat, obstacle) && !obstacle.collided) {
        obstacle.collided = true; // Mark the obstacle as collided
        if (this.cat.loseLife()) {
          this.triggerGameOver();
        } else {
          console.log("Hit detected, life lost.");
          this.cat.flash(); // Trigger the flash effect
        }
      }
    });
  }
  isColliding(cat, obstacle) {
    const catRect = {
      left: cat.x + cat.hitbox.x,
      right: cat.x + cat.hitbox.x + cat.hitbox.width,
      top: cat.y + cat.hitbox.y,
      bottom: cat.y + cat.hitbox.y + cat.hitbox.height
    };
    const obstacleRect = {
      left: obstacle.x + obstacle.hitbox.x,
      right: obstacle.x + obstacle.hitbox.x + obstacle.hitbox.width,
      top: obstacle.y + obstacle.hitbox.y,
      bottom: obstacle.y + obstacle.hitbox.y + obstacle.hitbox.height
    };

    // Check for intersection
    return !(catRect.right < obstacleRect.left ||
      catRect.left > obstacleRect.right ||
      catRect.bottom < obstacleRect.top ||
      catRect.top > obstacleRect.bottom);
  }

  triggerGameOver() {
    if (!this.gameOver) {
      this.gameOver = true;
      this.stop();
      this.elapsedTime = Date.now() - this.startTime;
      this.drawGameOverBox();
      cancelAnimationFrame(this.initialStateAnimationFrameId);
    }
  }

  handleGameOverClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if the click is within the retry button bounds
    if (x > this.retryButton.x && x < this.retryButton.x + this.retryButton.width &&
      y > this.retryButton.y && y < this.retryButton.y + this.retryButton.height) {
      this.restartGame();
    }
  }

  restartGame() {
    this.obstacles = [];
    this.score = 0;
    this.cat.lives = 3; // Reset cat lives
    this.gameOver = false;
    this.start();
  }

  drawGameOverBox() {
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    const boxWidth = 400;
    const boxHeight = 200;
    const timePlayed = this.formatTime(this.elapsedTime);

    // Draw box
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);

    // Draw text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'gameFont';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Game Over, your score was ${this.score}`, centerX, centerY - 30);
    this.ctx.fillText(`Time played: ${timePlayed}`, centerX, centerY + 10);

    // Draw Retry button
    const buttonWidth = 100;
    const buttonHeight = 40;
    this.retryButton = { x: centerX - buttonWidth / 2, y: centerY + 50, width: buttonWidth, height: buttonHeight };

    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(this.retryButton.x, this.retryButton.y, this.retryButton.width, this.retryButton.height);

    this.ctx.fillStyle = 'black';
    this.ctx.fillText('Retry', this.retryButton.x + buttonWidth / 2, this.retryButton.y + buttonHeight / 2 + 5);


  }

  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  setCat(cat) {
    this.cat = cat;
  }

  start() {
    this.isRunning = true;
    this.cat.startRunning(); // Change to running animation
    this.scheduleNextObstacle(); // Start scheduling obstacles
    this.update();
    this.startTime = Date.now();
  }

  stop() {
    this.isRunning = false;
    clearTimeout(this.obstacleTimeout);
    cancelAnimationFrame(this.animationFrameId);
  }


  renderInitialState() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.layers.forEach(layer => layer.draw());
    this.cat.draw();
    this.cat.update();
    this.obstacles.forEach(obstacle => obstacle.update());
    this.obstacles.forEach(obstacle => obstacle.draw());
    this.obstacles = this.obstacles.filter(obstacle => !obstacle.offScreen());
    this.initialStateAnimationFrameId = requestAnimationFrame(() => this.renderInitialState());
  }


  update() {
    if (!this.isRunning || this.gameOver) return;

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.layers.forEach(layer => layer.update());
    this.layers.forEach(layer => layer.draw());
    this.cat.update();
    this.cat.draw();

    // Update and draw obstacles, and check if off-screen
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update();
      obstacle.draw();
      if (obstacle.offScreen()) {
        this.score++; // Increment score for each obstacle that goes off-screen
        console.log(`Score: ${this.score}`); // Log score
        this.obstacles.splice(i, 1); // Remove obstacle from array
      }
    }

    this.checkCollisions();
    this.drawScoreAndLives()
    this.animationFrameId = requestAnimationFrame(() => this.update());
  }
}
class Cat {
  constructor(ctx, standSprites, runSprites, jumpSprites) {
    this.ctx = ctx;
    this.standSprites = standSprites;
    this.runSprites = runSprites;
    this.jumpSprites = jumpSprites
    this.currentSprites = standSprites;
    this.currentFrame = 0;
    this.spriteTimer = 0;
    this.standSpriteInterval = 200; // Interval for standing
    this.runSpriteInterval = 200; // Interval for running, can be different
    this.jumpSpriteInterval = 200
    this.spriteInterval = this.standSpriteInterval;
    this.x = 450; // Starting x position
    this.y = canvas.height - 50; // Starting y position (adjust as needed)
    this.groundY = this.y
    this.jumpVelocity = 0;
    this.gravity = 0.4; // Gravity could be adjusted
    this.isJumping = false;
    this.lives = 3; // Start with 3 lives
    const initialSprite = standSprites[0];
    this.hitbox = {
      x: 12, // Adjust as needed
      y: 7, // Adjust as needed
      width: initialSprite.width - 0, // Adjust as needed
      height: initialSprite.height - 10 // Adjust as needed
    };

    // HIT ANIMATION ON CAT
    this.isFlashing = false;
    this.flashDuration = 1000; // Duration of the flash effect in milliseconds
    this.flashTimer = 0;
    this.flashInterval = 100; // Interval at which the sprite visibility toggles during flash
  }
  startRunning() {
    if (!this.isJumping) {
      this.currentSprites = this.runSprites;
      this.spriteInterval = this.runSpriteInterval;
    }
  }
  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.currentSprites = this.jumpSprites;
      this.spriteInterval = this.jumpSpriteInterval;
      this.jumpVelocity = -12; // This will make the cat move upwards initially
    }
  }

  loseLife() {
    this.lives -= 1;
    if (this.lives <= 0) {
      // Trigger game over if no lives left
      return true;
    }
    // Return false to indicate the game should continue
    return false;
  }

  flash() {
    this.isFlashing = true;
    this.flashTimer = 0;
  }

  update() {
    this.spriteTimer += 16.67; // Approximation of 60 FPS



    if (this.spriteTimer >= this.spriteInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.currentSprites.length;
      this.spriteTimer = 0;
    }
    if (this.isJumping) {
      this.y += this.jumpVelocity;
      this.jumpVelocity += this.gravity;
      if (this.y > this.groundY) { // Cat has landed
        this.y = this.groundY;
        this.isJumping = false;
        this.startRunning(); // Go back to running or standing
      }
    }
    if (this.isFlashing) {
      this.flashTimer += 16.67; // Approximation of 60 FPS
      if (this.flashTimer > this.flashDuration) {
        this.isFlashing = false;
      }
    }
  }

  draw() {
    const sprite = this.currentSprites[this.currentFrame];

    if (sprite && sprite.complete) {
      // Flash effect logic
      if (this.isFlashing && Math.floor(this.flashTimer / this.flashInterval) % 2 === 0) {
        // Skip drawing the sprite for this frame to create a flash effect
        // Still draw the hitbox for debugging

      } else {
        // Draw the cat sprite
        this.ctx.drawImage(sprite, this.x, this.y);
        // Draw hitbox for debugging

      }
    }
  }

}

class Obstacle {
  constructor(ctx, image, x, y, scale) {
    this.ctx = ctx;
    this.image = image;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.width = this.image.width * this.scale;
    this.height = this.image.height * this.scale;
    this.speed = 2.5;
    this.hitbox = { x: 5, y: 5, width: this.width - 10, height: this.height - 10 }; // Example values, adjust as needed
    this.collided = false;
  }

  update() {
    this.x -= this.speed; // Move the obstacle to the left
  }
  // TEST COMMENT
  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    this.hitbox = { x: 0, y: 0, width: this.width, height: this.height };
  }

  offScreen() {
    return this.x + this.width < 0; // Check if the obstacle is off-screen
  }
}




const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 400;

function startGame() {


  const parallaxBackgroundPaths = [
    '/sprites/background/enchanted_background2.png',
    '/sprites/background/grey_pyramids.png',
    '/sprites/background/blackPyramids.png',
    '/sprites/background/front_pyramids.png',
  ];

  const standSpritePaths = [
    '/sprites/stand/catStanding1.png',
    '/sprites/stand/catStanding2.png',
    '/sprites/stand/catStanding3.png',
    '/sprites/stand/catStanding4.png'
  ];

  const runningSpritePaths = [
    '/sprites/run/cat001.png',
    '/sprites/run/cat002.png',
    '/sprites/run/cat003.png',
    '/sprites/run/cat004.png',
    '/sprites/run/cat005.png',
    '/sprites/run/cat006.png',
    '/sprites/run/cat007.png',
    '/sprites/run/cat008.png'
  ];

  const obstacleSpritePaths = [
    '/sprites/obstacles/tomb1.png',
    '/sprites/obstacles/tomb2.png',
    '/sprites/obstacles/tomb3.png',
  ];

  const jumpingSpritePaths = [
    '/sprites/jump/catJumping1.png',
    '/sprites/jump/catJumping2.png',
    '/sprites/jump/catJumping3.png',
    '/sprites/jump/catJumping4.png',
    '/sprites/jump/catJumping5.png',
    '/sprites/jump/catJumping6.png',
    '/sprites/jump/catJumping7.png',
  ];



  console.log('Starting to load images...');

  // Use Promise.all to load all image assets in parallel
  Promise.all([
    loadImages(parallaxBackgroundPaths),
    loadImages(standSpritePaths),
    loadImages(runningSpritePaths),
    loadImages(jumpingSpritePaths),
    loadImages(obstacleSpritePaths),
    loadHeartImage('/sprites/blackheart.png') // Correct path and file extension
  ]).then(([
    backgroundImages,
    standSprites,
    runSprites,
    jumpSprites,
    obstacleImages,
    heartImage // This now comes from the Promise.all
  ]) => {
    const layerSpeeds = [4, 1.2, 1.8, 4];
    console.log('All images loaded successfully.');
    const layers = backgroundImages.map((image, index) => {
      let layerHeight = index === 0 ? ctx.canvas.height : 351;
      const speed = layerSpeeds[index]; // Use speed from the array
      return new BackgroundLayer(ctx, image, speed, layerHeight);
    });

    const cat = new Cat(ctx, standSprites, runSprites, jumpSprites);
    const game = new Game(ctx, layers, obstacleImages);
    game.setCat(cat);
    game.renderInitialState();
    game.heartImage = heartImage;



    // Listen for key press to make the cat jump
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        game.cat.jump();
      }
    });

    // Setup the start button logic
    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
      game.start();
      startButton.style.display = 'none';
    });
  }).catch(error => {
    console.error('Error loading images:', error);
  });
}


startGame(); // Call startGame to run the game
