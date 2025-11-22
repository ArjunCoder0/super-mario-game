const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'loading';
let score = 0;
let coins = 0;
let lives = 3;
let cameraX = 0;
let lastPlatformX = 0;
let distance = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let scaleFactor = 1;
let comboCount = 0;
let lastCoinTime = 0;
let powerUpActive = false;
let powerUpTimer = 0;

// Funny messages
const funnyMessages = [
    "🎉 MAMA MIA!",
    "🍄 SUPER MARIO!",
    "⭐ WAHOO!",
    "🔥 ON FIRE!",
    "💪 UNSTOPPABLE!",
    "🎯 PERFECT!",
    "🚀 FLYING HIGH!",
    "⚡ LIGHTNING FAST!",
    "🎪 AMAZING!",
    "🎨 SPECTACULAR!"
];

const deathMessages = [
    "😵 OUCH!",
    "💀 GAME OVER!",
    "😱 OH NO!",
    "🤦 TRY AGAIN!",
    "😢 SO CLOSE!",
    "💥 BOOM!",
    "🙈 WHOOPS!",
    "😅 BETTER LUCK!"
];

let currentMessage = '';
let messageTimer = 0;

// Adjust canvas and scale for mobile
function adjustCanvasForMobile() {
    if (isMobile || window.innerWidth < 768) {
        // Make everything MUCH bigger on mobile
        scaleFactor = 2;
        mario.width = 64;
        mario.height = 64;
    } else {
        scaleFactor = 1;
        mario.width = 32;
        mario.height = 32;
    }
    console.log('📱 Scale factor:', scaleFactor);
}

// Controls
const keys = {};

// Audio Context
let audioContext = null;
let bgMusicNode = null;
let isMusicPlaying = false;
let audioEnabled = false;

function initAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Audio Context created:', audioContext.state);
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                audioEnabled = true;
                console.log('✅ Audio Context resumed:', audioContext.state);
            }).catch(err => {
                console.error('❌ Failed to resume audio:', err);
            });
        } else {
            audioEnabled = true;
            console.log('✅ Audio ready:', audioContext.state);
        }
        
        return true;
    } catch (e) {
        console.error('❌ Audio initialization failed:', e);
        return false;
    }
}

// Sound Effects
const sounds = {
    jump: () => playSound(300, 0.1, 'sine'),
    coin: () => playSound(800, 0.1, 'square'),
    enemyDefeat: () => playSound(200, 0.15, 'sawtooth'),
    die: () => playSound(100, 0.3, 'triangle'),
    gameOver: () => playSound(150, 0.5, 'sine')
};

function playSound(frequency, duration, type = 'sine') {
    if (!audioContext) {
        console.warn('⚠️ Audio context not initialized');
        return;
    }
    
    if (audioContext.state === 'suspended') {
        console.warn('⚠️ Audio context suspended');
        audioContext.resume();
        return;
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        console.log('🔊 Playing sound:', frequency + 'Hz');
    } catch (e) {
        console.error('❌ Sound error:', e);
    }
}

// Test audio function
function testAudio() {
    console.log('🧪 Testing audio...');
    initAudio();
    
    setTimeout(() => {
        console.log('Playing test beep...');
        playSound(440, 0.2, 'sine'); // A4 note
        
        setTimeout(() => {
            playSound(554, 0.2, 'sine'); // C#5 note
        }, 300);
        
        setTimeout(() => {
            playSound(659, 0.2, 'sine'); // E5 note
        }, 600);
    }, 100);
}

// Background Music
function startBackgroundMusic() {
    if (!audioContext) {
        console.warn('⚠️ Cannot start music: Audio context not initialized');
        return;
    }
    
    if (isMusicPlaying) {
        console.log('🎵 Music already playing');
        return;
    }
    
    console.log('🎵 Starting background music...');
    
    const notes = [
        { freq: 659.25, duration: 0.15 }, // E
        { freq: 659.25, duration: 0.15 }, // E
        { freq: 0, duration: 0.15 },
        { freq: 659.25, duration: 0.15 }, // E
        { freq: 0, duration: 0.15 },
        { freq: 523.25, duration: 0.15 }, // C
        { freq: 659.25, duration: 0.15 }, // E
        { freq: 0, duration: 0.15 },
        { freq: 783.99, duration: 0.3 },  // G
        { freq: 0, duration: 0.3 },
        { freq: 392.00, duration: 0.3 },  // G (lower)
    ];
    
    let noteIndex = 0;
    
    function playNextNote() {
        if (!isMusicPlaying || gameState !== 'playing' || !audioContext) {
            console.log('🎵 Music stopped');
            return;
        }
        
        try {
            const note = notes[noteIndex];
            
            if (note.freq > 0 && audioContext.state === 'running') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = note.freq;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + note.duration);
            }
            
            noteIndex = (noteIndex + 1) % notes.length;
            setTimeout(playNextNote, note.duration * 1000);
        } catch (e) {
            console.error('❌ Music error:', e);
            isMusicPlaying = false;
        }
    }
    
    isMusicPlaying = true;
    playNextNote();
}

function stopBackgroundMusic() {
    console.log('🎵 Stopping music');
    isMusicPlaying = false;
}

// Custom images
const customImages = {
    player: null,
    enemy1: null,
    jet: null,
    rocket: null
};

function loadCustomImage(inputId, key) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Store the original image
                    customImages[key] = img;
                    console.log(`✅ Loaded ${key} image: ${img.width}x${img.height}`);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Mario
const mario = {
    x: 100,
    y: 400,
    width: 32,
    height: 32,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 13,
    gravity: 0.6,
    onGround: false,
    direction: 1,
    
    update() {
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.velocityX = -this.speed;
            this.direction = -1;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.velocityX = this.speed;
            this.direction = 1;
        } else {
            this.velocityX = 0;
        }
        
        if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && this.onGround) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
            sounds.jump();
        }
        
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.y + this.height >= canvas.height - 80) {
            this.y = canvas.height - 80 - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }
        
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + 20 &&
                this.velocityY >= 0) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
        });
        
        if (this.y + this.height >= canvas.height - 80) {
            this.onGround = true;
        }
        
        if (this.x > canvas.width / 2) {
            cameraX = this.x - canvas.width / 2;
        }
        
        distance = Math.floor(this.x / 100);
        
        if (this.y > canvas.height) {
            this.die();
        }
    },
    
    draw() {
        const drawX = this.x - cameraX;
        const scale = this.width / 32; // Scale based on width
        
        // Power-up glow effect
        if (powerUpActive) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
        }
        
        if (customImages.player) {
            // Draw custom image scaled to Mario's current size
            ctx.drawImage(customImages.player, drawX, this.y, this.width, this.height);
        } else {
            // Scale all dimensions
            const bodyColor = powerUpActive ? '#FFD700' : '#E52521';
            ctx.fillStyle = bodyColor;
            ctx.fillRect(drawX + 8 * scale, this.y + 12 * scale, 16 * scale, 12 * scale);
            ctx.fillStyle = '#FDB99B';
            ctx.fillRect(drawX + 8 * scale, this.y + 4 * scale, 16 * scale, 10 * scale);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(drawX + 6 * scale, this.y, 20 * scale, 6 * scale);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX + 4 * scale, this.y + 4 * scale, 24 * scale, 2 * scale);
            ctx.fillStyle = '#000';
            if (this.direction === 1) {
                ctx.fillRect(drawX + 14 * scale, this.y + 8 * scale, 3 * scale, 3 * scale);
                ctx.fillRect(drawX + 20 * scale, this.y + 8 * scale, 3 * scale, 3 * scale);
            } else {
                ctx.fillRect(drawX + 9 * scale, this.y + 8 * scale, 3 * scale, 3 * scale);
                ctx.fillRect(drawX + 15 * scale, this.y + 8 * scale, 3 * scale, 3 * scale);
            }
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX + 10 * scale, this.y + 12 * scale, 12 * scale, 3 * scale);
            ctx.fillStyle = '#2B60DE';
            ctx.fillRect(drawX + 10 * scale, this.y + 20 * scale, 12 * scale, 8 * scale);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(drawX + 12 * scale, this.y + 22 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(drawX + 18 * scale, this.y + 22 * scale, 2 * scale, 2 * scale);
            ctx.fillStyle = '#2B60DE';
            ctx.fillRect(drawX + 10 * scale, this.y + 28 * scale, 4 * scale, 4 * scale);
            ctx.fillRect(drawX + 18 * scale, this.y + 28 * scale, 4 * scale, 4 * scale);
        }
        
        ctx.shadowBlur = 0;
    },
    
    die() {
        lives--;
        sounds.die();
        showMessage(deathMessages[Math.floor(Math.random() * deathMessages.length)]);
        comboCount = 0;
        powerUpActive = false;
        mario.speed = 5;
        mario.jumpPower = 13;
        updateHUD();
        if (lives <= 0) {
            endGame();
        } else {
            this.reset();
        }
    },
    
    reset() {
        this.x = 100;
        this.y = 400;
        this.velocityX = 0;
        this.velocityY = 0;
        cameraX = 0;
    }
};

// Infinite generation
const platforms = [];
const coinsList = [];
const enemies = [];

const patterns = [
    { platforms: [{ dx: 200, dy: 450, width: 120 }, { dx: 350, dy: 400, width: 100 }, { dx: 480, dy: 350, width: 100 }] },
    { platforms: [{ dx: 200, dy: 420, width: 100 }, { dx: 450, dy: 380, width: 120 }] },
    { platforms: [{ dx: 200, dy: 320, width: 100 }, { dx: 330, dy: 370, width: 100 }, { dx: 460, dy: 420, width: 120 }] },
    { platforms: [{ dx: 200, dy: 400, width: 200 }] },
    { platforms: [{ dx: 180, dy: 380, width: 80 }, { dx: 300, dy: 350, width: 80 }, { dx: 420, dy: 380, width: 80 }] },
    { platforms: [{ dx: 200, dy: 450, width: 100 }, { dx: 400, dy: 280, width: 120 }] },
    { platforms: [] }
];

function generatePlatform() {
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const enemyScale = isMobile ? 2 : 1;
    const coinScale = isMobile ? 1.5 : 1;
    
    pattern.platforms.forEach(p => {
        const platform = {
            x: lastPlatformX + p.dx,
            y: p.dy,
            width: p.width,
            height: 20
        };
        platforms.push(platform);
        
        if (Math.random() > 0.4) {
            const numCoins = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numCoins; i++) {
                coinsList.push({
                    x: platform.x + 20 + i * 40,
                    y: platform.y - 50,
                    collected: false,
                    radius: 12 * coinScale
                });
            }
        }
        
        if (Math.random() > 0.6) {
            const enemyTypes = ['ground', 'jet', 'rocket'];
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            if (type === 'ground') {
                enemies.push({
                    x: platform.x + 50,
                    y: platform.y - 30 * enemyScale,
                    width: 30 * enemyScale,
                    height: 30 * enemyScale,
                    velocityX: Math.random() > 0.5 ? 2 : -2,
                    velocityY: 0,
                    type: 'ground',
                    direction: 1,
                    minX: platform.x,
                    maxX: platform.x + platform.width
                });
            } else if (type === 'jet') {
                enemies.push({
                    x: platform.x + 50,
                    y: platform.y - 80,
                    width: 40 * enemyScale,
                    height: 25 * enemyScale,
                    velocityX: Math.random() > 0.5 ? 3 : -3,
                    velocityY: 0,
                    type: 'jet',
                    direction: 1,
                    minX: platform.x - 100,
                    maxX: platform.x + platform.width + 100
                });
            } else {
                enemies.push({
                    x: platform.x + 50,
                    y: platform.y - 150,
                    width: 30 * enemyScale,
                    height: 40 * enemyScale,
                    velocityX: 0,
                    velocityY: 3,
                    type: 'rocket',
                    direction: 1,
                    minY: platform.y - 200,
                    maxY: platform.y - 50
                });
            }
        }
    });
    
    lastPlatformX += 600;
}

function initializeWorld() {
    platforms.length = 0;
    coinsList.length = 0;
    enemies.length = 0;
    lastPlatformX = 0;
    
    for (let i = 0; i < 10; i++) {
        generatePlatform();
    }
}

function updateWorld() {
    while (platforms.length > 0 && platforms[0].x < cameraX - 200) {
        platforms.shift();
    }
    
    for (let i = coinsList.length - 1; i >= 0; i--) {
        if (coinsList[i].collected || coinsList[i].x < cameraX - 200) {
            coinsList.splice(i, 1);
        }
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].x < cameraX - 200) {
            enemies.splice(i, 1);
        }
    }
    
    if (lastPlatformX < cameraX + canvas.width + 1000) {
        generatePlatform();
    }
}

function drawBackground() {
    // Professional clean sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 100);
    gradient.addColorStop(0, '#5c94fc');
    gradient.addColorStop(0.7, '#87ceeb');
    gradient.addColorStop(1, '#b8d4f1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Subtle sun
    ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
    ctx.beginPath();
    ctx.arc(canvas.width - 120, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 150, 0.5)';
    ctx.beginPath();
    ctx.arc(canvas.width - 120, 80, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Clouds with parallax - fluffy white
    const cloudOffset = cameraX * 0.3;
    
    for (let i = 0; i < 6; i++) {
        const x = (i * 350 - cloudOffset) % (canvas.width + 350) - 100;
        const y = 60 + (i % 3) * 50;
        const size = 0.8 + (i % 3) * 0.2;
        drawCloud(x, y, size);
    }
    
    // Ground with professional brick pattern
    const groundY = canvas.height - 80;
    const groundOffset = Math.floor(cameraX) % 40;
    
    // Ground base
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, groundY, canvas.width, 80);
    
    // Grass on top
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, groundY - 5, canvas.width, 5);
    
    // Brick pattern
    for (let x = -40; x < canvas.width + 40; x += 40) {
        ctx.fillStyle = '#C84C0C';
        ctx.fillRect(x - groundOffset, groundY, 38, 38);
        
        // Brick highlight
        ctx.fillStyle = '#E67E50';
        ctx.fillRect(x - groundOffset + 2, groundY + 2, 34, 8);
        
        // Brick shadow
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x - groundOffset + 2, groundY + 30, 34, 6);
    }
}

function drawMountain(x, y, width, height) {
    // Mountain body with slightly curved edges
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Left slope with slight curve
    ctx.quadraticCurveTo(
        x + width * 0.3, y - height * 0.6,
        x + width / 2, y - height
    );
    
    // Right slope with slight curve
    ctx.quadraticCurveTo(
        x + width * 0.7, y - height * 0.6,
        x + width, y
    );
    
    ctx.closePath();
    ctx.fill();
    
    // Snow cap
    const currentFill = ctx.fillStyle;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + width / 2 - 25, y - height + 35);
    ctx.lineTo(x + width / 2, y - height);
    ctx.lineTo(x + width / 2 + 25, y - height + 35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = currentFill;
}

function drawHill(x, y, width, height) {
    // Draw smooth, rounded hills using bezier curves
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    
    // Left slope - gentle curve up
    ctx.bezierCurveTo(
        x + width * 0.15, y - height * 0.3,
        x + width * 0.3, y - height * 0.7,
        x + width * 0.5, y - height
    );
    
    // Right slope - gentle curve down
    ctx.bezierCurveTo(
        x + width * 0.7, y - height * 0.7,
        x + width * 0.85, y - height * 0.3,
        x + width + 20, y
    );
    
    ctx.lineTo(x + width + 20, canvas.height);
    ctx.lineTo(x - 20, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawCloud(x, y, size = 1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 20 * size, 0, Math.PI * 2);
    ctx.arc(x + 20 * size, y - 5 * size, 25 * size, 0, Math.PI * 2);
    ctx.arc(x + 40 * size, y - 5 * size, 25 * size, 0, Math.PI * 2);
    ctx.arc(x + 60 * size, y, 20 * size, 0, Math.PI * 2);
    ctx.fill();
    
    // Cloud shadow for depth
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 20 * size, 0, Math.PI * 2);
    ctx.arc(x + 22 * size, y - 3 * size, 25 * size, 0, Math.PI * 2);
    ctx.arc(x + 42 * size, y - 3 * size, 25 * size, 0, Math.PI * 2);
    ctx.arc(x + 62 * size, y + 2, 20 * size, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlatforms() {
    ctx.fillStyle = '#8B4513';
    platforms.forEach(platform => {
        const drawX = platform.x - cameraX;
        if (drawX > -platform.width && drawX < canvas.width) {
            ctx.fillRect(drawX, platform.y, platform.width, platform.height);
            ctx.fillStyle = '#A0522D';
            for (let x = 0; x < platform.width; x += 40) {
                ctx.fillRect(drawX + x + 2, platform.y + 2, 36, 16);
            }
            ctx.fillStyle = '#8B4513';
        }
    });
}

function drawCoins() {
    const currentTime = Date.now();
    
    coinsList.forEach(coin => {
        if (!coin.collected) {
            const drawX = coin.x - cameraX;
            const radius = coin.radius || 12;
            
            if (drawX > -50 && drawX < canvas.width + 50) {
                if (Math.abs(mario.x - coin.x) < 30 && Math.abs(mario.y - coin.y) < 30) {
                    coin.collected = true;
                    coins++;
                    
                    // Combo system
                    if (currentTime - lastCoinTime < 1000) {
                        comboCount++;
                        score += 100 * comboCount;
                        if (comboCount >= 3) {
                            showMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
                        }
                    } else {
                        comboCount = 1;
                        score += 100;
                    }
                    
                    lastCoinTime = currentTime;
                    sounds.coin();
                    
                    // Random power-up (5% chance)
                    if (Math.random() < 0.05) {
                        activatePowerUp();
                    }
                    
                    updateHUD();
                }
                
                // Spinning coin animation - scale width based on sine wave
                const time = Date.now() / 300;
                const scaleX = Math.abs(Math.cos(time + coin.x / 100));
                
                ctx.save();
                ctx.translate(drawX, coin.y);
                ctx.scale(scaleX, 1);
                
                // Outer circle
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner circle
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.66, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.type === 'ground') {
            enemy.x += enemy.velocityX;
            if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
                enemy.velocityX *= -1;
                enemy.direction *= -1;
            }
        } else if (enemy.type === 'jet') {
            enemy.x += enemy.velocityX;
            if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
                enemy.velocityX *= -1;
                enemy.direction *= -1;
            }
        } else if (enemy.type === 'rocket') {
            enemy.y += enemy.velocityY;
            if (enemy.y < enemy.minY || enemy.y > enemy.maxY) {
                enemy.velocityY *= -1;
                enemy.direction *= -1;
            }
        }
        
        if (Math.abs(mario.x - enemy.x) < 30 && Math.abs(mario.y - enemy.y) < 30) {
            if (enemy.type === 'ground' && mario.velocityY > 0 && mario.y < enemy.y) {
                enemy.x = -10000;
                mario.velocityY = -8;
                score += 200;
                sounds.enemyDefeat();
                updateHUD();
            } else {
                mario.die();
            }
        }
    });
}

function drawEnemies() {
    const time = Date.now();
    
    enemies.forEach(enemy => {
        const drawX = enemy.x - cameraX;
        
        if (drawX > -100 && drawX < canvas.width + 100) {
            // Wobble animation - smaller and smoother
            const wobble = Math.sin(time / 300 + enemy.x / 50) * 3;
            
            if (enemy.type === 'ground') {
                const scale = enemy.width / 30;
                if (customImages.enemy1) {
                    // Draw custom image scaled to enemy's current size
                    ctx.drawImage(customImages.enemy1, drawX, enemy.y + wobble, enemy.width, enemy.height);
                } else {
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(drawX, enemy.y + wobble, enemy.width, enemy.height);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(drawX + 5 * scale, enemy.y + 8 * scale + wobble, 8 * scale, 8 * scale);
                    ctx.fillRect(drawX + 17 * scale, enemy.y + 8 * scale + wobble, 8 * scale, 8 * scale);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(drawX + 8 * scale, enemy.y + 11 * scale + wobble, 3 * scale, 3 * scale);
                    ctx.fillRect(drawX + 20 * scale, enemy.y + 11 * scale + wobble, 3 * scale, 3 * scale);
                    ctx.fillRect(drawX + 5 * scale, enemy.y + 28 * scale + wobble, 8 * scale, 2 * scale);
                    ctx.fillRect(drawX + 17 * scale, enemy.y + 28 * scale + wobble, 8 * scale, 2 * scale);
                }
            } else if (enemy.type === 'jet') {
                const scale = enemy.width / 40;
                if (customImages.jet) {
                    // Draw custom image scaled to jet's current size
                    ctx.drawImage(customImages.jet, drawX, enemy.y + wobble, enemy.width, enemy.height);
                } else {
                    ctx.fillStyle = '#4169E1';
                    ctx.fillRect(drawX, enemy.y + wobble, enemy.width, enemy.height);
                    ctx.fillStyle = '#1E90FF';
                    ctx.beginPath();
                    ctx.moveTo(drawX + enemy.width, enemy.y + enemy.height / 2 + wobble);
                    ctx.lineTo(drawX + enemy.width - 10 * scale, enemy.y + wobble);
                    ctx.lineTo(drawX + enemy.width - 10 * scale, enemy.y + enemy.height + wobble);
                    ctx.fill();
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(drawX + 5 * scale, enemy.y + 8 * scale + wobble, 8 * scale, 8 * scale);
                    
                    // Animated flames - pulsing effect
                    const flamePulse = 1 + Math.sin(time / 100) * 0.3;
                    const flameLength = 10 * scale * flamePulse;
                    
                    ctx.fillStyle = '#FF4500';
                    ctx.fillRect(drawX - flameLength, enemy.y + 8 * scale + wobble, flameLength, 8 * scale);
                    ctx.fillStyle = '#FFA500';
                    ctx.fillRect(drawX - flameLength * 0.7, enemy.y + 10 * scale + wobble, flameLength * 0.7, 4 * scale);
                }
            } else if (enemy.type === 'rocket') {
                const scale = enemy.width / 30;
                const sideWobble = Math.sin(time / 200 + enemy.y / 50) * 2;
                
                if (customImages.rocket) {
                    // Draw custom image scaled to rocket's current size
                    ctx.drawImage(customImages.rocket, drawX + sideWobble, enemy.y, enemy.width, enemy.height);
                } else {
                    ctx.fillStyle = '#DC143C';
                    ctx.fillRect(drawX + sideWobble, enemy.y, enemy.width, enemy.height);
                    ctx.fillStyle = '#FF6347';
                    ctx.beginPath();
                    ctx.moveTo(drawX + enemy.width / 2 + sideWobble, enemy.y);
                    ctx.lineTo(drawX + sideWobble, enemy.y + 10 * scale);
                    ctx.lineTo(drawX + enemy.width + sideWobble, enemy.y + 10 * scale);
                    ctx.fill();
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(drawX + 10 * scale + sideWobble, enemy.y + 15 * scale, 10 * scale, 10 * scale);
                    
                    // Animated flames - pulsing effect
                    const flamePulse = 1 + Math.sin(time / 100) * 0.4;
                    const flameLength = 10 * scale * flamePulse;
                    
                    ctx.fillStyle = '#FF4500';
                    ctx.fillRect(drawX + 5 * scale + sideWobble, enemy.y + enemy.height, 20 * scale, flameLength);
                    ctx.fillStyle = '#FFA500';
                    ctx.fillRect(drawX + 8 * scale + sideWobble, enemy.y + enemy.height + 3 * scale, 14 * scale, flameLength * 0.7);
                }
            }
        }
    });
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins;
    document.getElementById('lives').textContent = lives;
    document.getElementById('distance').textContent = distance;
}

function showMessage(msg) {
    currentMessage = msg;
    messageTimer = 60; // Show for 1 second at 60fps
}

function activatePowerUp() {
    powerUpActive = true;
    powerUpTimer = 300; // 5 seconds at 60fps
    mario.speed = 7;
    mario.jumpPower = 15;
    showMessage("⭐ POWER UP!");
    playSound(1000, 0.3, 'square');
}

function updatePowerUp() {
    if (powerUpActive) {
        powerUpTimer--;
        if (powerUpTimer <= 0) {
            powerUpActive = false;
            mario.speed = 5;
            mario.jumpPower = 13;
        }
    }
}

function drawMessage() {
    if (messageTimer > 0) {
        messageTimer--;
        const alpha = messageTimer / 60;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        
        const y = 100 + (60 - messageTimer) * 2;
        ctx.strokeText(currentMessage, canvas.width / 2, y);
        ctx.fillText(currentMessage, canvas.width / 2, y);
        ctx.restore();
    }
}

function drawCombo() {
    if (comboCount > 1 && Date.now() - lastCoinTime < 1000) {
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FF6347';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(`${comboCount}x COMBO!`, canvas.width / 2, 150);
        ctx.fillText(`${comboCount}x COMBO!`, canvas.width / 2, 150);
    }
}

function drawPowerUpBar() {
    if (powerUpActive) {
        const barWidth = 200;
        const barHeight = 20;
        const x = canvas.width / 2 - barWidth / 2;
        const y = 180;
        const progress = powerUpTimer / 300;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ POWER UP ⭐', canvas.width / 2, y - 5);
    }
}

function drawCredits() {
    // Made by Arjun - top LEFT corner (so it doesn't overlap with pause button)
    ctx.save();
    
    // Adjust font size for mobile
    const fontSize = isMobile ? 11 : 14;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = isMobile ? 2 : 3;
    ctx.textAlign = 'left';
    
    const text = '💻 Made by Arjun';
    const x = 10;
    const y = 20;
    
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
}

function gameLoop() {
    if (gameState === 'playing') {
        drawBackground();
        updateWorld();
        drawPlatforms();
        drawCoins();
        drawEnemies();
        
        mario.update();
        updateEnemies();
        updatePowerUp();
        mario.draw();
        
        drawMessage();
        drawCombo();
        drawPowerUpBar();
        drawCredits();
    }
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'playing';
    score = 0;
    coins = 0;
    lives = 3;
    distance = 0;
    cameraX = 0;
    mario.reset();
    initializeWorld();
    updateHUD();
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    
    // Mobile controls removed - use keyboard/touch on canvas instead
    
    startBackgroundMusic();
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        stopBackgroundMusic();
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
        startBackgroundMusic();
    }
}

function endGame() {
    gameState = 'gameOver';
    stopBackgroundMusic();
    sounds.gameOver();
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalDistance').textContent = distance;
    document.getElementById('finalCoins').textContent = coins;
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
    }
    
    document.getElementById('bestScore').textContent = bestScore;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function returnToMenu() {
    gameState = 'start';
    stopBackgroundMusic();
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
    }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') pauseGame();
        else if (gameState === 'paused') resumeGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Setup event listeners
function setupEventListeners() {
    // Button events
    const testAudioBtn = document.getElementById('testAudioBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');
    const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
    const quitBtn = document.getElementById('quitBtn');
    const menuBtn = document.getElementById('menuBtn');
    
    if (testAudioBtn) {
        testAudioBtn.addEventListener('click', () => {
            testAudio();
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('🎮 Starting game...');
            initAudio();
            setTimeout(() => {
                startGame();
            }, 100);
        });
    }
    
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
    if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
    if (restartBtn) restartBtn.addEventListener('click', startGame);
    if (restartFromPauseBtn) restartFromPauseBtn.addEventListener('click', startGame);
    if (quitBtn) quitBtn.addEventListener('click', returnToMenu);
    if (menuBtn) menuBtn.addEventListener('click', returnToMenu);

    // Mobile controls
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');

    if (leftBtn) {
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['ArrowLeft'] = true;
        });

        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowLeft'] = false;
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['ArrowRight'] = true;
        });

        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowRight'] = false;
        });
    }

    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[' '] = true;
        });

        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[' '] = false;
        });
    }
    
    console.log('✅ Event listeners setup complete');
}

// Initialize when DOM is ready
function initialize() {
    console.log('🎮 Initializing game...');
    
    // Verify canvas
    if (!canvas || !ctx) {
        console.error('❌ Canvas not found!');
        return;
    }
    
    // Adjust for mobile
    adjustCanvasForMobile();
    
    // Setup event listeners first
    setupEventListeners();
    
    // Load custom images
    loadCustomImage('playerImage', 'player');
    loadCustomImage('enemy1Image', 'enemy1');
    loadCustomImage('jetImage', 'jet');
    loadCustomImage('rocketImage', 'rocket');

    const bestScoreEl = document.getElementById('bestScore');
    if (bestScoreEl) {
        bestScoreEl.textContent = bestScore;
    }

    // Hide loading screen immediately
    const loadingScreen = document.getElementById('loadingScreen');
    const startScreen = document.getElementById('startScreen');
    
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (startScreen) startScreen.classList.remove('hidden');
    
    gameState = 'start';
    console.log('✅ Game ready!');

    gameLoop();
}

// Handle window resize
window.addEventListener('resize', () => {
    adjustCanvasForMobile();
});

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
