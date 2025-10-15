const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddle settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const PADDLE_MARGIN = 10;

// Ball settings
const BALL_SIZE = 16;
let ballX = WIDTH / 2 - BALL_SIZE / 2;
let ballY = HEIGHT / 2 - BALL_SIZE / 2;
let ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);

// Left paddle (player)
let leftPaddleY = HEIGHT / 2 - PADDLE_HEIGHT / 2;

// Right paddle (AI)
let rightPaddleY = HEIGHT / 2 - PADDLE_HEIGHT / 2;
const AI_SPEED = 3;

// Scores
let leftScore = 0;
let rightScore = 0;
const WIN_SCORE = 10;

// Sound setup (using Web Audio API)
const AudioContext = window.AudioContext ? window.AudioContext : (window.webkitAudioContext ? window.webkitAudioContext : null);
const audioCtx = AudioContext ? new AudioContext() : null;

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  // Unique sounds for events
  if (type === 'paddle') {
    osc.type = 'square';
    osc.frequency.value = 440 + Math.random() * 80; // Paddle hit: sharp, random pitch
    gain.gain.value = 0.1;
  } else if (type === 'wall') {
    osc.type = 'triangle';
    osc.frequency.value = 330;
    gain.gain.value = 0.07;
  } else if (type === 'miss') {
    osc.type = 'sawtooth';
    osc.frequency.value = 220;
    gain.gain.value = 0.2;
  }
  osc.start();
  osc.stop(audioCtx.currentTime + 0.12);
}

// Countdown logic
let gameActive = false;
let showingResult = false;

function drawCountdown(count = 1) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.font = '48px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  let message = count < 4 ? count.toString() : "GO!";
  ctx.fillText(message, WIDTH / 2, HEIGHT / 2);
  if (count < 4) {
    setTimeout(() => drawCountdown(count + 1), 700);
  } else {
    setTimeout(() => {
      gameActive = true;
      draw();
    }, 700);
  }
}

function drawResult(win) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center';
  
  if (win) {
    ctx.font = '64px monospace';
    ctx.fillStyle = 'limegreen';
    ctx.fillText("YOU WIN!!!", WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText("congrats!!, maybe it was just luck? ;p", WIDTH / 2, HEIGHT / 2 + 25);
  } else {
    ctx.font = '64px monospace';
    ctx.fillStyle = 'red';
    ctx.fillText("YOU LOST!", WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText("try again : )", WIDTH / 2, HEIGHT / 2 + 25);
  }
}

function resetBall() {
  ballX = WIDTH / 2 - BALL_SIZE / 2;
  ballY = HEIGHT / 2 - BALL_SIZE / 2;
  ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
}

function draw() {
  if (!gameActive) return;
  if (showingResult) {
    // Draw result screen if game ended
    drawResult(leftScore >= WIN_SCORE);
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Draw paddles
  ctx.fillStyle = "#fff";
  // Left paddle
  ctx.fillRect(PADDLE_MARGIN, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
  // Right paddle
  ctx.fillRect(WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Draw ball
  ctx.beginPath();
  ctx.arc(ballX + BALL_SIZE / 2, ballY + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw scores
  ctx.font = '32px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(leftScore, WIDTH / 2 - 48, 40);
  ctx.fillText(rightScore, WIDTH / 2 + 48, 40);

  // Move ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Ball collision with top/bottom walls
  if (ballY <= 0 || ballY + BALL_SIZE >= HEIGHT) {
    ballSpeedY *= -1;
    playSound('wall');
  }

  // Ball collision with left paddle
  if (
    ballX <= PADDLE_MARGIN + PADDLE_WIDTH &&
    ballY + BALL_SIZE >= leftPaddleY &&
    ballY <= leftPaddleY + PADDLE_HEIGHT
  ) {
    ballSpeedX *= -1;
    ballSpeedY += (Math.random() - 0.5) * 2;
    ballX = PADDLE_MARGIN + PADDLE_WIDTH; // prevent sticking
    playSound('paddle');
  }

  // Ball collision with right paddle
  if (
    ballX + BALL_SIZE >= WIDTH - PADDLE_MARGIN - PADDLE_WIDTH &&
    ballY + BALL_SIZE >= rightPaddleY &&
    ballY <= rightPaddleY + PADDLE_HEIGHT
  ) {
    ballSpeedX *= -1;
    ballSpeedY += (Math.random() - 0.5) * 2;
    ballX = WIDTH - PADDLE_MARGIN - PADDLE_WIDTH - BALL_SIZE; // prevent sticking
    playSound('paddle');
  }

  // Ball out of bounds (reset to center, update score and show countdown)
  if (ballX < 0) {
    rightScore++;
    playSound('miss');
    resetBall();
    if (rightScore >= WIN_SCORE) {
      // Show "YOU LOST!"
      showingResult = true;
      drawResult(false);
      return;
    } else {
      gameActive = false;
      setTimeout(() => drawCountdown(1), 500);
    }
    return;
  } else if (ballX > WIDTH) {
    leftScore++;
    playSound('miss');
    resetBall();
    if (leftScore >= WIN_SCORE) {
      // Show "YOU WIN!!!"
      showingResult = true;
      drawResult(true);
      return;
    } else {
      gameActive = false;
      setTimeout(() => drawCountdown(1), 500);
    }
    return;
  }

  // AI paddle movement
  if (rightPaddleY + PADDLE_HEIGHT / 2 < ballY + BALL_SIZE / 2) {
    rightPaddleY += AI_SPEED;
  } else if (rightPaddleY + PADDLE_HEIGHT / 2 > ballY + BALL_SIZE / 2) {
    rightPaddleY -= AI_SPEED;
  }
  // Prevent AI paddle from going out of bounds
  rightPaddleY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, rightPaddleY));

  requestAnimationFrame(draw);
}

function endGame(win) {
  showingResult = true;
  drawResult(win);
  setTimeout(() => {
    leftScore = 0;
    rightScore = 0;
    resetBall();
    showingResult = false;
    gameActive = false;
    drawCountdown(1);
  }, 3000);
}

// Mouse movement for left paddle
canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  leftPaddleY = mouseY - PADDLE_HEIGHT / 2;
  // Prevent paddle from going out of bounds
  leftPaddleY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, leftPaddleY));
});

// Start the game with countdown
setTimeout(() => drawCountdown(1), 300);