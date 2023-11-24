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
    this.obstacleIntervalId = null; // Store the interval ID here
    this.obstacles = [];
    this.obstacleImages = obstacleImages; // Store the obstacle images
  }


  setCat(cat) {
    this.cat = cat;
  }


  addRandomObstacle() {
    // Randomly choose an obstacle image
    const image = this.obstacleImages[Math.floor(Math.random() * this.obstacleImages.length)];
    const scale = 0.5; // Make sure scale is defined
    const obstacleYPosition = this.ctx.canvas.height - (image.height * this.scale);
    const obstacleXPosition = this.ctx.canvas.width;
    const obstacle = new Obstacle(this.ctx, image, this.ctx.canvas.width, obstacleYPosition, scale);
    this.obstacles.push(obstacle);
  }


  start() {
    this.isRunning = true;
    this.cat.startRunning(); // Change to running animation
    this.update();

    // Set up an interval to add new obstacles
    this.obstacleIntervalId = setInterval(() => {
      this.addRandomObstacle();
    }, 2000); // Spawn an obstacle every 2000 ms (2 seconds)
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    clearInterval(this.obstacleIntervalId); // Clear the interval when the game stops
  }

  renderInitialState() {

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Draw each background layer
    this.layers.forEach(layer => layer.draw());

    // Draw the cat in its current frame
    this.cat.draw();

    // Call update on the cat to change its frame for the animation
    this.cat.update();

    // Continue the loop
    this.initialStateAnimationFrameId = requestAnimationFrame(() => this.renderInitialState());
  }


  update() {
    if (!this.isRunning) return;

    const now = Date.now();
    if (now - this.lastObstacleTime > this.obstacleSpawnRate) {
      this.addRandomObstacle();
      this.lastObstacleTime = now;
    }

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.layers.forEach(layer => layer.update());
    this.layers.forEach(layer => layer.draw());

    console.log(`Obstacles before filter: ${this.obstacles.length}`);
    this.obstacles.forEach(obstacle => obstacle.update());
    this.obstacles = this.obstacles.filter(obstacle => !obstacle.offScreen());
    console.log(`Obstacles after filter: ${this.obstacles.length}`);

    this.obstacles.forEach(obstacle => obstacle.draw());

    this.cat.update();
    this.cat.draw();

    this.animationFrameId = requestAnimationFrame(() => this.update());
  }
}


class Obstacle {
  constructor(ctx, image, x, y, scale) {
    this.ctx = ctx;
    this.image = image;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.width = image.width
    this.height = image.height
  }

  update() {
    this.x -= 0;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    // Draw a border around the obstacle
    this.ctx.strokeStyle = 'blue';
    this.ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
  offScreen() {
    // This function checks if the obstacle is off-screen and can be removed
    return this.x + this.width < 0;
  }
}


class Cat {
  constructor(ctx, standSprites, runSprites) {
    this.ctx = ctx;
    this.standSprites = standSprites;
    this.runSprites = runSprites;
    this.currentSprites = standSprites; // Initially the cat is standing
    this.currentFrame = 0;
    this.spriteTimer = 0;
    this.standSpriteInterval = 200; // Interval for standing
    this.runSpriteInterval = 100; // Interval for running, can be different
    this.spriteInterval = this.standSpriteInterval;
    this.x = 450; // Starting x position
    this.y = canvas.height - 50; // Starting y position (adjust as needed)
  }

  startRunning() {
    this.currentSprites = this.runSprites;
    this.spriteInterval = this.runSpriteInterval;
  }

  update() {
    this.spriteTimer += 16.67; // Approximation of 60 FPS
    if (this.spriteTimer >= this.spriteInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.currentSprites.length;
      this.spriteTimer = 0;
    }
  }

  draw() {
    const sprite = this.currentSprites[this.currentFrame];
    if (sprite && sprite.complete) {
      this.ctx.drawImage(sprite, this.x, this.y);
      // Draw a border around the cat
      this.ctx.strokeStyle = 'red';
      this.ctx.strokeRect(this.x, this.y, sprite.width, sprite.height);
    }
  }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 400;

function startGame() {


  const parallaxBackgroundPaths = [
    '/sprites/background/enchanted_background2.png',
    '/sprites/background/blackPyramids.png',
    '/sprites/background/grey_pyramids.png',
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

  const obstacleImagePath = [
    '/sprites/obstacles/tomb1.png',
    '/sprites/obstacles/tomb2.png',
    '/sprites/obstacles/tomb3.png',
  ];


  console.log('Starting to load images...');

  let game;
  console.log("game", game)

  // Use Promise.all to load all image assets in parallel
  Promise.all([
    loadImages(parallaxBackgroundPaths),
    loadImages(standSpritePaths),
    loadImages(runningSpritePaths),
    loadImages(obstacleImagePath)
  ]).then(([backgroundImages, standSprites, runSprites, obstacleImages]) => {
    console.log('All images loaded successfully.');
    const layers = backgroundImages.map((image, index) => {
      let layerHeight = index === 0 ? ctx.canvas.height : 351;
      const speed = 3 + index * 0.5;
      return new BackgroundLayer(ctx, image, speed, layerHeight);
    });

    const cat = new Cat(ctx, standSprites, runSprites);
    game = new Game(ctx, layers, obstacleImages);
    game.setCat(cat);
    game.renderInitialState();

    // Setup the start button logic
    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
      game.start();
      startButton.style.display = 'none';
      console.log("game", game)

    });
  }).catch(error => {
    console.error('Error loading images:', error);
  });
}


startGame(); // Call startGame to run the game
