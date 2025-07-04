const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverDiv = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORM_RADIUS = 4;
const SPEED = 2.5;
const TURN_ANGLE = Math.PI / 32;

let gameRunning = true;
let animationId;

let worm = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    angle: 0,
    trail: []
};

function resetGame() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    worm = {
        x: WIDTH / 2,
        y: HEIGHT / 2,
        angle: 0,
        trail: []
    };
    gameRunning = true;
    gameOverDiv.style.display = 'none';
    restartBtn.style.display = 'none';
    loop();
}

function drawWorm() {
    ctx.beginPath();
    ctx.arc(worm.x, worm.y, WORM_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#0ff';
    ctx.fill();
}

function moveWorm() {
    worm.x += Math.cos(worm.angle) * SPEED;
    worm.y += Math.sin(worm.angle) * SPEED;
    worm.trail.push({ x: worm.x, y: worm.y });
}

function checkCollision() {
    // Border collision
    if (
        worm.x < WORM_RADIUS ||
        worm.x > WIDTH - WORM_RADIUS ||
        worm.y < WORM_RADIUS ||
        worm.y > HEIGHT - WORM_RADIUS
    ) {
        return true;
    }
    // Self collision
    for (let i = 0; i < worm.trail.length - 10; i++) { // skip last 10 to avoid instant collision
        let t = worm.trail[i];
        let dx = worm.x - t.x;
        let dy = worm.y - t.y;
        if (dx * dx + dy * dy < WORM_RADIUS * WORM_RADIUS * 1.5) {
            return true;
        }
    }
    return false;
}

function loop() {
    if (!gameRunning) return;
    moveWorm();
    if (checkCollision()) {
        gameOver();
        return;
    }
    drawWorm();
    animationId = requestAnimationFrame(loop);
}

function gameOver() {
    gameRunning = false;
    gameOverDiv.style.display = 'block';
    restartBtn.style.display = 'inline-block';
    cancelAnimationFrame(animationId);
}

// Controls
window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        worm.angle -= TURN_ANGLE;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        worm.angle += TURN_ANGLE;
    }
});

restartBtn.addEventListener('click', resetGame);

// Start the game
resetGame(); 