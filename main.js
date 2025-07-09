// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const gameOverDiv = document.getElementById('gameOver');
    const restartBtn = document.getElementById('restartBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const roundInfo = document.getElementById('roundInfo');
    const resultsPage = document.getElementById('resultsPage');
    const newGameBtn = document.getElementById('newGameBtn');
    const modeSelection = document.getElementById('modeSelection');
    const startGameBtn = document.getElementById('startGameBtn');
    const powerupInfo = document.getElementById('powerupInfo');

    // Score elements
    const scoreElements = [
        document.getElementById('score1'),
        document.getElementById('score2'),
        document.getElementById('score3'),
        document.getElementById('score4')
    ];
    const finalScoreElements = [
        document.getElementById('finalScore1'),
        document.getElementById('finalScore2'),
        document.getElementById('finalScore3'),
        document.getElementById('finalScore4')
    ];
    const winnersList = document.getElementById('winnersList');

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const WORM_RADIUS = 4;
    const BASE_SPEED = 2.0;
    const TURN_ANGLE = Math.PI / 21.33;
    const TOTAL_ROUNDS = 20;

    let gameRunning = true;
    let animationId;
    let currentRound = 1;
    let scores = [0, 0, 0, 0];
    let roundWinners = [];
    let selectedGameMode = 'survival';
    let currentSpeed = BASE_SPEED;
    let speedIncreaseTimer = 0;
    let particles = [];
    let powerups = [];
    let obstacles = [];
    let territories = [];
    let teams = [[1, 2], [3, 4]]; // Team 1: Players 1&2, Team 2: Players 3&4

    // Power-up types
    const POWERUP_TYPES = {
        SPEED_BOOST: { name: 'Speed Boost', duration: 5000, color: '#ff0', key: 'S' },
        GHOST: { name: 'Ghost Mode', duration: 3000, color: '#0ff', key: 'G' },
        TRAIL_ERASER: { name: 'Trail Eraser', duration: 4000, color: '#f0f', key: 'T' },
        SHIELD: { name: 'Shield', duration: 2000, color: '#0f0', key: 'H' },
        TELEPORT: { name: 'Teleport', duration: 0, color: '#f80', key: 'P' }
    };

    // 4 players with different colors and starting positions
    let players = [
        {
            id: 1,
            x: WIDTH * 0.25,
            y: HEIGHT * 0.25,
            angle: 0,
            trail: [],
            color: '#ff0000',
            keys: { left: 'a', right: 'd' },
            alive: true,
            speed: BASE_SPEED,
            powerups: {},
            team: 1
        },
        {
            id: 2,
            x: WIDTH * 0.75,
            y: HEIGHT * 0.25,
            angle: Math.PI,
            trail: [],
            color: '#00ff00',
            keys: { left: 'j', right: 'l' },
            alive: true,
            speed: BASE_SPEED,
            powerups: {},
            team: 1
        },
        {
            id: 3,
            x: WIDTH * 0.25,
            y: HEIGHT * 0.75,
            angle: Math.PI / 2,
            trail: [],
            color: '#0000ff',
            keys: { left: 'ArrowLeft', right: 'ArrowRight' },
            alive: true,
            speed: BASE_SPEED,
            powerups: {},
            team: 2
        },
        {
            id: 4,
            x: WIDTH * 0.75,
            y: HEIGHT * 0.75,
            angle: -Math.PI / 2,
            trail: [],
            color: '#ffff00',
            keys: { left: 'n', right: 'm' },
            alive: true,
            speed: BASE_SPEED,
            powerups: {},
            team: 2
        }
    ];

    // Game Mode Selection
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            modeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedGameMode = card.dataset.mode;
        });
    });

    startGameBtn.addEventListener('click', () => {
        modeSelection.style.display = 'none';
        initializeGameMode();
        updateScoreboard();
        resetRound();
    });

    function initializeGameMode() {
        switch(selectedGameMode) {
            case 'survival':
                powerupInfo.style.display = 'none';
                break;
            case 'territory':
                powerupInfo.style.display = 'none';
                initializeTerritories();
                break;
            case 'speed':
                powerupInfo.style.display = 'none';
                currentSpeed = BASE_SPEED;
                speedIncreaseTimer = 0;
                break;
            case 'maze':
                powerupInfo.style.display = 'none';
                initializeMaze();
                break;
            case 'team':
                powerupInfo.style.display = 'none';
                break;
            case 'powerups':
                powerupInfo.style.display = 'block';
                spawnPowerup();
                break;
        }
    }

    function initializeTerritories() {
        territories = [];
        for (let i = 0; i < 4; i++) {
            territories.push({
                player: i + 1,
                area: 0,
                color: players[i].color
            });
        }
    }

    function initializeMaze() {
        obstacles = [];
        // Create some random walls
        for (let i = 0; i < 8; i++) {
            obstacles.push({
                x: Math.random() * (WIDTH - 100) + 50,
                y: Math.random() * (HEIGHT - 100) + 50,
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50
            });
        }
    }

    function spawnPowerup() {
        if (Math.random() < 0.02) { // 2% chance per frame
            const types = Object.keys(POWERUP_TYPES);
            const type = types[Math.floor(Math.random() * types.length)];
            powerups.push({
                x: Math.random() * (WIDTH - 40) + 20,
                y: Math.random() * (HEIGHT - 40) + 20,
                type: type,
                color: POWERUP_TYPES[type].color
            });
        }
    }

    function createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            if (particle.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        particles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    function drawObstacles() {
        ctx.fillStyle = '#666';
        obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    }

    function drawPowerups() {
        powerups.forEach(powerup => {
            ctx.fillStyle = powerup.color;
            ctx.beginPath();
            ctx.arc(powerup.x, powerup.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    function drawTerritories() {
        territories.forEach(territory => {
            ctx.fillStyle = territory.color + '20';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        });
    }

    function updateScoreboard() {
        for (let i = 0; i < 4; i++) {
            scoreElements[i].textContent = scores[i];
        }
        roundInfo.textContent = `Round ${currentRound} of ${TOTAL_ROUNDS} - ${selectedGameMode.charAt(0).toUpperCase() + selectedGameMode.slice(1)} Mode`;
    }

    function resetRound() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        particles = [];
        powerups = [];
        
        players = [
            {
                id: 1,
                x: WIDTH * 0.25,
                y: HEIGHT * 0.25,
                angle: 0,
                trail: [],
                color: '#ff0000',
                keys: { left: 'a', right: 'd' },
                alive: true,
                speed: BASE_SPEED,
                powerups: {},
                team: 1
            },
            {
                id: 2,
                x: WIDTH * 0.75,
                y: HEIGHT * 0.25,
                angle: Math.PI,
                trail: [],
                color: '#00ff00',
                keys: { left: 'j', right: 'l' },
                alive: true,
                speed: BASE_SPEED,
                powerups: {},
                team: 1
            },
            {
                id: 3,
                x: WIDTH * 0.25,
                y: HEIGHT * 0.75,
                angle: Math.PI / 2,
                trail: [],
                color: '#0000ff',
                keys: { left: 'ArrowLeft', right: 'ArrowRight' },
                alive: true,
                speed: BASE_SPEED,
                powerups: {},
                team: 2
            },
            {
                id: 4,
                x: WIDTH * 0.75,
                y: HEIGHT * 0.75,
                angle: -Math.PI / 2,
                trail: [],
                color: '#ffff00',
                keys: { left: 'n', right: 'm' },
                alive: true,
                speed: BASE_SPEED,
                powerups: {},
                team: 2
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
        
        // Draw power-up effects
        if (player.powerups.shield) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        if (player.powerups.ghost) {
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    function moveWorm(player) {
        const speed = player.powerups.speedBoost ? player.speed * 1.5 : player.speed;
        player.x += Math.cos(player.angle) * speed;
        player.y += Math.sin(player.angle) * speed;
        player.trail.push({ x: player.x, y: player.y });
        
        // Trail eraser effect
        if (player.powerups.trailEraser) {
            if (player.trail.length > 5) {
                player.trail.splice(0, player.trail.length - 5);
            }
        }
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

        // Obstacle collision (maze mode)
        if (selectedGameMode === 'maze') {
            for (let obstacle of obstacles) {
                if (player.x > obstacle.x && player.x < obstacle.x + obstacle.width &&
                    player.y > obstacle.y && player.y < obstacle.y + obstacle.height) {
                    return true;
                }
            }
        }

        // Self collision (unless ghost mode)
        if (!player.powerups.ghost) {
            for (let i = 0; i < player.trail.length - 10; i++) {
                let t = player.trail[i];
                let dx = player.x - t.x;
                let dy = player.y - t.y;
                if (dx * dx + dy * dy < WORM_RADIUS * WORM_RADIUS * 1.5) {
                    return true;
                }
            }
        }

        // Collision with other players (unless shield)
        if (!player.powerups.shield) {
            for (let otherPlayer of players) {
                if (otherPlayer.id !== player.id && otherPlayer.alive) {
                    let dx = player.x - otherPlayer.x;
                    let dy = player.y - otherPlayer.y;
                    if (dx * dx + dy * dy < WORM_RADIUS * WORM_RADIUS * 4) {
                        return true;
                    }

                    if (!player.powerups.ghost) {
                        for (let t of otherPlayer.trail) {
                            dx = player.x - t.x;
                            dy = player.y - t.y;
                            if (dx * dx + dy * dy < WORM_RADIUS * WORM_RADIUS * 1.5) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    function checkPowerupCollision(player) {
        for (let i = powerups.length - 1; i >= 0; i--) {
            const powerup = powerups[i];
            const dx = player.x - powerup.x;
            const dy = player.y - powerup.y;
            if (dx * dx + dy * dy < 100) {
                activatePowerup(player, powerup.type);
                powerups.splice(i, 1);
            }
        }
    }

    function activatePowerup(player, type) {
        const powerup = POWERUP_TYPES[type];
        player.powerups[type.toLowerCase().replace(' ', '')] = true;
        
        if (type === 'TELEPORT') {
            // Find safe location
            let attempts = 0;
            do {
                player.x = Math.random() * (WIDTH - 100) + 50;
                player.y = Math.random() * (HEIGHT - 100) + 50;
                attempts++;
            } while (checkCollision(player) && attempts < 50);
        } else {
            setTimeout(() => {
                player.powerups[type.toLowerCase().replace(' ', '')] = false;
            }, powerup.duration);
        }
    }

    function loop() {
        if (!gameRunning) return;

        // Speed mode: gradually increase speed
        if (selectedGameMode === 'speed') {
            speedIncreaseTimer++;
            if (speedIncreaseTimer % 300 === 0) { // Every 5 seconds
                currentSpeed += 0.2;
                players.forEach(p => p.speed = currentSpeed);
            }
        }

        // Spawn powerups
        if (selectedGameMode === 'powerups') {
            spawnPowerup();
        }

        // Move and check all alive players
        for (let player of players) {
            if (player.alive) {
                moveWorm(player);
                checkPowerupCollision(player);
                if (checkCollision(player)) {
                    player.alive = false;
                    createParticles(player.x, player.y, player.color, 20);
                }
            }
        }

        // Check if round is over
        let aliveCount = players.filter(p => p.alive).length;
        if (aliveCount <= 1) {
            roundOver();
            return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Draw game elements based on mode
        if (selectedGameMode === 'maze') {
            drawObstacles();
        }
        if (selectedGameMode === 'territory') {
            drawTerritories();
        }
        if (selectedGameMode === 'powerups') {
            drawPowerups();
        }

        // Draw all alive players
        for (let player of players) {
            if (player.alive) {
                drawWorm(player);
            }
        }

        // Update and draw particles
        updateParticles();
        drawParticles();

        animationId = requestAnimationFrame(loop);
    }

    function roundOver() {
        gameRunning = false;
        let alivePlayers = players.filter(p => p.alive);
        let winnerText = "";
        
        if (selectedGameMode === 'team') {
            // Team mode logic
            let team1Alive = alivePlayers.filter(p => p.team === 1).length;
            let team2Alive = alivePlayers.filter(p => p.team === 2).length;
            
            if (team1Alive > 0 && team2Alive === 0) {
                winnerText = `Team 1 wins Round ${currentRound}!`;
                scores[0]++; scores[1]++;
                roundWinners.push('Team 1');
            } else if (team2Alive > 0 && team1Alive === 0) {
                winnerText = `Team 2 wins Round ${currentRound}!`;
                scores[2]++; scores[3]++;
                roundWinners.push('Team 2');
            } else {
                winnerText = `Round ${currentRound} - It's a tie!`;
                roundWinners.push('Tie');
            }
        } else {
            // Individual mode logic
            if (alivePlayers.length === 1) {
                let winner = alivePlayers[0];
                winnerText = `Player ${winner.id} wins Round ${currentRound}!`;
                scores[winner.id - 1]++;
                roundWinners.push(winner.id);
            } else {
                winnerText = `Round ${currentRound} - It's a tie!`;
                roundWinners.push(0);
            }
        }
        
        gameOverDiv.textContent = winnerText;
        gameOverDiv.style.display = 'block';
        updateScoreboard();
        
        if (currentRound >= TOTAL_ROUNDS) {
            restartBtn.textContent = "View Results";
        } else {
            restartBtn.textContent = "Next Round";
        }
        restartBtn.style.display = 'inline-block';
        cancelAnimationFrame(animationId);
    }

    function showResults() {
        for (let i = 0; i < 4; i++) {
            finalScoreElements[i].textContent = scores[i];
        }

        let maxScore = Math.max(...scores);
        let winners = [];
        for (let i = 0; i < 4; i++) {
            if (scores[i] === maxScore) {
                winners.push(i + 1);
            }
        }

        winnersList.innerHTML = "";
        if (winners.length === 1) {
            winnersList.innerHTML = `<div class="winner-item">🏆 Player ${winners[0]} wins the tournament! 🏆</div>`;
        } else {
            winnersList.innerHTML = `<div class="winner-item">🏆 It's a tie! Players ${winners.join(', ')} share the victory! 🏆</div>`;
        }

        let roundResults = "<h4>Round Results:</h4>";
        for (let i = 0; i < roundWinners.length; i++) {
            if (roundWinners[i] === 0 || roundWinners[i] === 'Tie') {
                roundResults += `<div>Round ${i + 1}: Tie</div>`;
            } else {
                roundResults += `<div>Round ${i + 1}: ${roundWinners[i]}</div>`;
            }
        }
        winnersList.innerHTML += roundResults;

        resultsPage.style.display = 'flex';
    }

    function startNewTournament() {
        currentRound = 1;
        scores = [0, 0, 0, 0];
        roundWinners = [];
        resultsPage.style.display = 'none';
        modeSelection.style.display = 'flex';
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
        // Power-up keys (for power-up mode)
        else if (selectedGameMode === 'powerups') {
            if (e.key === 's') activatePowerup(players[0], 'SPEED_BOOST');
            else if (e.key === 'g') activatePowerup(players[0], 'GHOST');
            else if (e.key === 't') activatePowerup(players[0], 'TRAIL_ERASER');
            else if (e.key === 'h') activatePowerup(players[0], 'SHIELD');
            else if (e.key === 'p') activatePowerup(players[0], 'TELEPORT');
        }
    });

    // Touch/Click Controls
    if (leftBtn) {
        leftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            turnPlayer(1, 'left');
        });
        
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            turnPlayer(1, 'left');
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('click', (e) => {
            e.preventDefault();
            turnPlayer(1, 'right');
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            turnPlayer(1, 'right');
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (currentRound >= TOTAL_ROUNDS) {
                showResults();
            } else {
                currentRound++;
                resetRound();
            }
        });
    }

    if (newGameBtn) {
        newGameBtn.addEventListener('click', startNewTournament);
    }

    // Initialize the game
    updateScoreboard();
}); 