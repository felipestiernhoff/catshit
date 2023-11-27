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
  constructor(ctx, layers) {
    this.ctx = ctx;
    this.layers = layers;
    this.isRunning = false;
    this.animationFrameId = null;
  }


  setCat(cat) {
    this.cat = cat;
  }





  start() {
    this.isRunning = true;
    this.cat.startRunning(); // Change to running animation
    this.update();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
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

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.layers.forEach(layer => layer.update());
    this.layers.forEach(layer => layer.draw());

    this.cat.update();
    this.cat.draw();

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
    this.runSpriteInterval = 100; // Interval for running, can be different
    this.jumpSpriteInterval = 100
    this.spriteInterval = this.standSpriteInterval;
    this.x = 450; // Starting x position
    this.y = canvas.height - 50; // Starting y position (adjust as needed)
    this.groundY = this.y
    this.jumpVelocity = 0;
    this.gravity = 0.4; // Gravity could be adjusted
    this.isJumping = false;

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
  }

  draw() {
    const sprite = this.currentSprites[this.currentFrame];
    if (sprite && sprite.complete) {
      this.ctx.drawImage(sprite, this.x, this.y);

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

  let game;
  console.log("game", game)

  // Use Promise.all to load all image assets in parallel
  Promise.all([
    loadImages(parallaxBackgroundPaths),
    loadImages(standSpritePaths),
    loadImages(runningSpritePaths),
    loadImages(jumpingSpritePaths)
  ]).then(([backgroundImages, standSprites, runSprites, jumpSprites]) => {
    console.log('All images loaded successfully.');
    const layers = backgroundImages.map((image, index) => {
      let layerHeight = index === 0 ? ctx.canvas.height : 351;
      const speed = 3 + index * 0.5;
      return new BackgroundLayer(ctx, image, speed, layerHeight);
    });

    const cat = new Cat(ctx, standSprites, runSprites, jumpSprites);
    game = new Game(ctx, layers);
    game.setCat(cat);
    game.renderInitialState();

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
      console.log("game", game)

    });
  }).catch(error => {
    console.error('Error loading images:', error);
  });
}


startGame(); // Call startGame to run the game
