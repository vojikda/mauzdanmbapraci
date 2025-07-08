// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const gameOverDiv = document.getElementById('gameOver');
    const restartBtn = document.getElementById('restartBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');

    // Debug: Check if buttons are found
    console.log('Left button found:', leftBtn);
    console.log('Right button found:', rightBtn);

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const WORM_RADIUS = 4;
    const SPEED = 2.0;
    const TURN_ANGLE = Math.PI / 21.33;

    let gameRunning = true;
    let animationId;

    // 4 players with different colors and starting positions
    let players = [
        {
            id: 1,
            x: WIDTH * 0.25,
            y: HEIGHT * 0.25,
            angle: 0,
            trail: [],
            color: '#ff0000', // Red
            keys: { left: 'a', right: 'd' },
            alive: true
        },
        {
            id: 2,
            x: WIDTH * 0.75,
            y: HEIGHT * 0.25,
            angle: Math.PI,
            trail: [],
            color: '#00ff00', // Green
            keys: { left: 'j', right: 'l' },
            alive: true
        },
        {
            id: 3,
            x: WIDTH * 0.25,
            y: HEIGHT * 0.75,
            angle: Math.PI / 2,
            trail: [],
            color: '#0000ff', // Blue
            keys: { left: 'ArrowLeft', right: 'ArrowRight' },
            alive: true
        },
        {
            id: 4,
            x: WIDTH * 0.75,
            y: HEIGHT * 0.75,
            angle: -Math.PI / 2,
            trail: [],
            color: '#ffff00', // Yellow
            keys: { left: 'n', right: 'm' },
            alive: true
        }
    ];

    function resetGame() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        players = [
            {
                id: 1,
                x: WIDTH * 0.25,
                y: HEIGHT * 0.25,
                angle: 0,
                trail: [],
                color: '#ff0000',
                keys: { left: 'a', right: 'd' },
                alive: true
            },
            {
                id: 2,
                x: WIDTH * 0.75,
                y: HEIGHT * 0.25,
                angle: Math.PI,
                trail: [],
                color: '#00ff00',
                keys: { left: 'j', right: 'l' },
                alive: true
            },
            {
                id: 3,
                x: WIDTH * 0.25,
                y: HEIGHT * 0.75,
                angle: Math.PI / 2,
                trail: [],
                color: '#0000ff',
                keys: { left: 'ArrowLeft', right: 'ArrowRight' },
                alive: true
            },
            {
                id: 4,
                x: WIDTH * 0.75,
                y: HEIGHT * 0.75,
                angle: -Math.PI / 2,
                trail: [],
                color: '#ffff00',
                keys: { left: 'n', right: 'm' },
                alive: true
            }
        ];
        gameRunning = true;
        gameOverDiv.style.display = 'none';
        restartBtn.style.display = 'none';
        loop();
    }

    function drawWorm(player) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, WORM_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = player.color;
        ctx.fill();
    }

    function moveWorm(player) {
        player.x += Math.cos(player.angle) * SPEED;
        player.y += Math.sin(player.angle) * SPEED;
        player.trail.push({ x: player.x, y: player.y });
    }

    function checkCollision(player) {
        // Border collision
        if (
            player.x < WORM_RADIUS ||
            player.x > WIDTH - WORM_RADIUS ||
            player.y < WORM_RADIUS ||
            player.y > HEIGHT - WORM_RADIUS
        ) {
            return true;
        }

        // Self collision
        for (let i = 0; i < player.trail.length - 10; i++) {
            let t = player.trail[i];
            let dx = player.x - t.x;
            let dy = player.y - t.y;
            if (dx * dx + dy * dy < WORM_RADIUS * WORM_RADIUS * 1.5) {
                return true;
            }
        }

        // Collision with other players
        for (let otherPlayer of players) {
            if (otherPlayer.id !== player.id && otherPlayer.alive) {
                // Check collision with other player's current position
                let dx = player.x - otherPlayer.x;
                let dy = player.y - otherPlayer.y;
                if (dx * dx + dy * dy < WORM_RADIUS * WORM_RADIUS * 4) {
                    return true;
                }

                // Check collision with other player's trail
                for (let t of otherPlayer.trail) {
                    dx = player.x - t.x;
                    dy = player.y - t.y;
                    if (dx * dx + dy * dy < WORM_RADIUS * WORM_RADIUS * 1.5) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    function loop() {
        if (!gameRunning) return;

        // Move and check all alive players
        for (let player of players) {
            if (player.alive) {
                moveWorm(player);
                if (checkCollision(player)) {
                    player.alive = false;
                }
            }
        }

        // Check if game is over (only one or no players left)
        let aliveCount = players.filter(p => p.alive).length;
        if (aliveCount <= 1) {
            gameOver();
            return;
        }

        // Draw all alive players
        for (let player of players) {
            if (player.alive) {
                drawWorm(player);
            }
        }

        animationId = requestAnimationFrame(loop);
    }

    function gameOver() {
        gameRunning = false;
        let alivePlayers = players.filter(p => p.alive);
        let winnerText = alivePlayers.length === 1 ? 
            `Player ${alivePlayers[0].id} wins!` : 
            "Game Over - It's a tie!";
        gameOverDiv.textContent = winnerText;
        gameOverDiv.style.display = 'block';
        restartBtn.style.display = 'inline-block';
        cancelAnimationFrame(animationId);
    }

    function turnPlayer(playerId, direction) {
        let player = players.find(p => p.id === playerId);
        if (player && player.alive && gameRunning) {
            if (direction === 'left') {
                player.angle -= TURN_ANGLE;
            } else if (direction === 'right') {
                player.angle += TURN_ANGLE;
            }
        }
    }

    // Keyboard Controls for all 4 players
    window.addEventListener('keydown', (e) => {
        if (!gameRunning) return;

        // Player 1: A/D
        if (e.key === 'a') {
            turnPlayer(1, 'left');
        } else if (e.key === 'd') {
            turnPlayer(1, 'right');
        }
        // Player 2: J/L
        else if (e.key === 'j') {
            turnPlayer(2, 'left');
        } else if (e.key === 'l') {
            turnPlayer(2, 'right');
        }
        // Player 3: Arrow Keys
        else if (e.key === 'ArrowLeft') {
            turnPlayer(3, 'left');
        } else if (e.key === 'ArrowRight') {
            turnPlayer(3, 'right');
        }
        // Player 4: N/M
        else if (e.key === 'n') {
            turnPlayer(4, 'left');
        } else if (e.key === 'm') {
            turnPlayer(4, 'right');
        }
    });

    // Touch/Click Controls - Add error handling
    if (leftBtn) {
        leftBtn.addEventListener('click', (e) => {
            console.log('Left button clicked');
            e.preventDefault();
            // For mobile, control player 1
            turnPlayer(1, 'left');
        });
        
        leftBtn.addEventListener('touchstart', (e) => {
            console.log('Left button touched');
            e.preventDefault();
            turnPlayer(1, 'left');
        });
    } else {
        console.error('Left button not found!');
    }

    if (rightBtn) {
        rightBtn.addEventListener('click', (e) => {
            console.log('Right button clicked');
            e.preventDefault();
            // For mobile, control player 1
            turnPlayer(1, 'right');
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            console.log('Right button touched');
            e.preventDefault();
            turnPlayer(1, 'right');
        });
    } else {
        console.error('Right button not found!');
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', resetGame);
    } else {
        console.error('Restart button not found!');
    }

    // Start the game
    resetGame();
}); 