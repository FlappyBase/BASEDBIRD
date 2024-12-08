// Récupération du canvas et du contexte 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuration dynamique du canevas pour correspondre à l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables pour les sons
const flapSound = new Audio('flap.mp3');
flapSound.volume = 0.3; // Volume ajusté à 30%
const pointSound = new Audio('point.mp3');
const gameOverSound = new Audio('gameover.mp3');

// Musique de fond
const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true; // Musique répétée en boucle
backgroundMusic.volume = 0.5; // Volume ajusté à 50%

// Charger les images
const birdImg = new Image();
birdImg.src = 'bird.png';
const pipeTopImg = new Image();
pipeTopImg.src = 'pipeTop.png';
const pipeBottomImg = new Image();
pipeBottomImg.src = 'pipeBottom.png';
const cloudsImg = new Image();
cloudsImg.src = 'clouds.png';
const scoreImg = new Image();
scoreImg.src = 'police-Photoroom.png'; // Ajout de l'image pour 'SCORE'

// Variables du jeu
let bird = { x: 50, y: canvas.height / 2, size: 30, velocity: 0, gravity: 0.12, lift: -6 };
let pipes = [];
const pipeWidth = 70; 
const gap = 200;
const pipeSpeed = 2;
let score = 0;
let gameStarted = false;
let pipeTimer = 0;
const pipeInterval = 200; // Temps entre les tuyaux
const particles = [];
let scoreScale = 1; // Variable pour contrôler la taille du score
let backgroundX = 0; // Position du fond pour l'animation des nuages
let userAddress = null; // Adresse du wallet connecté

// Gestionnaire pour redimensionner le canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resetGame();
});

// Fonction pour vérifier si on est sur un appareil mobile
function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}


// Gestion du saut
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        bird.velocity = bird.lift;
        flapSound.currentTime = 0; 
        flapSound.play().catch(err => {
            console.error('Erreur lors de la lecture du son :', err);
        });

        if (!gameStarted) {
            gameStarted = true;
            backgroundMusic.play().catch(err => {
                console.error('Erreur lors de la lecture de la musique de fond :', err);
            });
        }
    }
});

// Gestion du saut sur mobile (événements tactiles)
window.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Empêcher le comportement par défaut
    bird.velocity = bird.lift;
    flapSound.currentTime = 0; 
    flapSound.play().catch(err => {
        console.error('Erreur lors de la lecture du son :', err);
    });

    if (!gameStarted) {
        gameStarted = true;
        backgroundMusic.play().catch(err => {
            console.error('Erreur lors de la lecture de la musique de fond :', err);
        });
    }
});


// Fonctionnalité Leaderboard mise à jour pour enregistrer le score du wallet connecté
function submitScore(score) {
    if (!userAddress) {
        console.error('Aucune adresse de wallet connectée. Connectez votre wallet avant d\'enregistrer le score.');
        return;
    }
}

// Fonction pour se connecter à MetaMask
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            console.log('Wallet connecté :', userAddress);
        } catch (error) {
            console.error('Erreur lors de la connexion au wallet :', error);
        }
    } else {
        console.error('MetaMask n\'est pas installé. Veuillez l\'installer pour utiliser cette fonctionnalité.');
    }
}

// Ajouter un bouton pour connecter le wallet
const connectButton = document.createElement('button');
connectButton.innerText = 'Connect';
connectButton.id = 'connectWalletButton';
connectButton.onclick = connectWallet;
document.body.appendChild(connectButton);

// Réinitialisation du jeu
function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    gameStarted = false;
    pipeTimer = 0;

    // Arrêter la musique de fond
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // Revenir au début de la musique
}

// Ajouter de nouveaux tuyaux
function addPipe() {
    const pipeTopHeight = Math.random() * (canvas.height - gap - 50) + 50;
    pipes.push({
        x: canvas.width,
        top: pipeTopHeight,
        bottom: pipeTopHeight + gap,
        passed: false
    });
}

// Particules
function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 5 + 2,
            color: color,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: (Math.random() - 0.5) * 4,
        });
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        p.x += p.velocityX;
        p.y += p.velocityY;
        p.radius *= 0.95;

        if (p.radius < 0.5) particles.splice(i, 1);
    }
}

// Mise à jour des tuyaux
function updatePipes() {
    pipeTimer++;

    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;

        if (pipe.x + pipeWidth < 0) pipes.splice(i, 1);

        if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
            pipe.passed = true;
            score++;
            pointSound.play();
            scoreScale = 1.5;
            createParticles(pipe.x + pipeWidth / 2, pipe.top + gap / 2, 'gold');
        }
    }

    if (pipeTimer >= pipeInterval) {
        addPipe();
        pipeTimer = 0;
    }
}

// Vérification des collisions
function checkCollision() {
    if (bird.y + bird.size > canvas.height || bird.y < 0) {
        return true;
    }

    for (let pipe of pipes) {
        if (
            bird.x + bird.size > pipe.x &&
            bird.x < pipe.x + pipeWidth &&
            (bird.y < pipe.top || bird.y + bird.size > pipe.bottom)
        ) {
            return true;
        }
    }

    return false;
}

// Dessiner l'oiseau
function drawBird() {
    ctx.drawImage(birdImg, bird.x - bird.size, bird.y - bird.size, bird.size * 2, bird.size * 1.5);
}

// Dessiner les tuyaux
function drawPipes() {
    for (let pipe of pipes) {
        ctx.drawImage(pipeTopImg, pipe.x, 0, pipeWidth, pipe.top);
        ctx.drawImage(pipeBottomImg, pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
    }
}

// Dessiner le fond
function drawBackground() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animation des nuages
    backgroundX -= 0.5;
    if (backgroundX <= -canvas.width) {
        backgroundX = 0;
    }

    ctx.drawImage(cloudsImg, backgroundX, 50, canvas.width, 200);
    ctx.drawImage(cloudsImg, backgroundX + canvas.width, 50, canvas.width, 200);
}

// Dessiner le score
function drawScore() {
    // Dessiner l'image "SCORE"
    ctx.drawImage(scoreImg, 10, -70, 165, 280);

    // Dessiner le score
    ctx.fillStyle = '#006dff'; // Noir
    ctx.font = `bold ${60 * scoreScale}px 'Courier New'`;
    ctx.lineWidth = 4;

    // Ajout d'une ombre au texte
    
    

    
    
    ctx.fillText(score, 160, 80);

    if (scoreScale > 1) {
        scoreScale -= 0.02;
    }
}

// Boucle principale
function gameLoop() {
    drawBackground();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameStarted) {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        updatePipes();

        if (checkCollision()) {
            gameOverSound.play();
            createParticles(bird.x, bird.y, 'red');
            submitScore(score);
            resetGame();
        }
    }

    drawParticles();
    drawBird();
    drawPipes();
    drawScore();

    requestAnimationFrame(gameLoop);
}

// Fonction pour générer un faux leaderboard
function generateFakeLeaderboard() {
    const fakeScores = [];
    for (let i = 0; i < 5; i++) {
        fakeScores.push({
            walletAddress: `0x${Math.random().toString(16).substr(2, 8)}`,
            score: Math.floor(Math.random() * 500),
        });
    }
    return fakeScores;
}

// Générer un faux leaderboard au démarrage du jeu
let fakeLeaderboard = generateFakeLeaderboard();

// Mise à jour du leaderboard toutes les heures
setInterval(() => {
    fakeLeaderboard = generateFakeLeaderboard();
}, 3600000); // 1 heure en millisecondes

// Fonction pour afficher le leaderboard
function displayLeaderboard() {
    // Trier les scores dans l'ordre décroissant
    fakeLeaderboard.sort((a, b) => b.score - a.score);

    let leaderboardContent = 'Leaderboard:\n';
    fakeLeaderboard.forEach((entry, index) => {
        leaderboardContent += `${index + 1}. ${entry.walletAddress} - Score: ${entry.score}\n`;
    });
    alert(leaderboardContent); // Affiche une boîte de dialogue avec le leaderboard
}

// Initialisation
resetGame();
addPipe();
gameLoop();

// Animation pour faire clignoter le bouton "Jouer"
const playButton = document.getElementById('playButton');

function animatePlayButton() {
    let opacity = 10;
    let decreasing = true;

    function step() {
        if (decreasing) {
            opacity -= 0.02;
            if (opacity <= 0.5) decreasing = false;
        } else {
            opacity += 0.02;
            if (opacity >= 1) decreasing = true;
        }

        playButton.style.opacity = opacity;

        requestAnimationFrame(step);
    }

    step();
}

animatePlayButton();

// Démarrer le jeu au clic sur le bouton "Jouer"
playButton.addEventListener('click', () => {
    document.getElementById('gameStartScreen').style.display = 'none';
    gameStarted = true;
    backgroundMusic.play().catch(err => {
        console.error('Erreur lors de la lecture de la musique de fond :', err);
    });
});
