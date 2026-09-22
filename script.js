const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const levelElement = document.querySelector("#levelValue");
const xpFill = document.querySelector("#xpFill");
const xpStatus = document.querySelector("#xpStatus");
const energyElement = document.querySelector("#energy");
const timerElement = document.querySelector("#timer");
const livesElement = document.querySelector("#lives");
const armorLevelElement = document.querySelector("#armorLevel");
const damageReceivedElement = document.querySelector("#damageReceived");
const healthFill = document.querySelector("#healthFill");
const pauseButton = document.querySelector("#pauseButton");
const pauseMessage = document.querySelector("#pauseMessage");
const resumeButton = document.querySelector("#resumeButton");
const gameMessage = document.querySelector("#gameMessage");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const restartButton = document.querySelector("#restartButton");
const fireButton = document.querySelector("#fireButton");
const soundButton = document.querySelector("#soundButton");
const shipOptions = document.querySelectorAll("[data-ship]");
const mapOptions = document.querySelectorAll("[data-map]");
const mapDescription = document.querySelector("#mapDescription");
const weaponOptions = document.querySelectorAll("[data-weapon]");
const weaponDescription = document.querySelector("#weaponDescription");
const fusionButton = document.querySelector("#fusionButton");
const fusionStatus = document.querySelector("#fusionStatus");
const pilotSelect = document.querySelector("#pilotSelect");
const pilotOptions = document.querySelectorAll("[data-pilot]");
const specialButton = document.querySelector("#specialButton");
const specialFill = document.querySelector("#specialFill");
const specialName = document.querySelector("#specialName");
const specialStatus = document.querySelector("#specialStatus");
const repairStatus = document.querySelector("#repairStatus");
const supportStatus = document.querySelector("#supportStatus");
const supportDetail = document.querySelector("#supportDetail");

const keys = new Set();
const ships = {
	scout: { speed: 390, radius: 16, lives: 3, fireRate: .24, bulletSpeed: 570, color: "#d7f36b", shape: "scout", weapon: "pulse", damage: 1 },
	hunter: { speed: 330, radius: 17, lives: 3, fireRate: .38, bulletSpeed: 530, color: "#71e2d3", shape: "hunter", weapon: "spread", damage: 1 },
	titan: { speed: 240, radius: 22, lives: 4, fireRate: .62, bulletSpeed: 450, color: "#ff754f", shape: "titan", weapon: "cannon", damage: 2 },
	special: { speed: 360, radius: 19, lives: 5, fireRate: .12, bulletSpeed: 650, color: "#b883ff", shape: "special", weapon: "machine", damage: 1 }
};
const weapons = {
	pulse: { name: "PULSO", description: "rápido e preciso", cooldown: .2, speed: 610, damage: 1, radius: 3, color: "#d7f36b", pattern: [0], type: "bolt" },
	spread: { name: "RAJADA", description: "três tiros por disparo", cooldown: .42, speed: 520, damage: 1, radius: 3, color: "#71e2d3", pattern: [-13, 0, 13], type: "bolt" },
	plasma: { name: "PLASMA", description: "projétil lento e devastador", cooldown: .58, speed: 390, damage: 3, radius: 7, color: "#ff754f", pattern: [0], type: "plasma" },
	rocket: { name: "FOGUETE", description: "explosão em área", cooldown: .78, speed: 310, damage: 2, radius: 6, color: "#d7f36b", pattern: [0], type: "rocket", splash: 52 },
	machine: { name: "METRALHADORA", description: "rajada contínua e veloz", cooldown: .09, speed: 680, damage: 1, radius: 3, color: "#b883ff", pattern: [-5, 5], type: "machine" },
	grenade: { name: "GRANADA", description: "fragmentação explosiva", cooldown: .9, speed: 260, damage: 3, radius: 7, color: "#ff754f", pattern: [0], type: "grenade", splash: 75 },
	beam: { name: "RAIO PLASMA", description: "feixe contínuo de energia", cooldown: .04, speed: 760, damage: 1, radius: 5, color: "#71e2d3", pattern: [0], type: "beam" }
};
const maps = {
	orbit: { description: "chuva de detritos e sinais instáveis", background: "#081319", accent: "#d7f36b", enemyRate: .66, enemyTypes: ["rock", "drone", "smart", "alien"], unlock: 1 },
	nebula: { description: "nuvem rubra, inimigos mais velozes", background: "#1d111d", accent: "#ff754f", enemyRate: .52, enemyTypes: ["drone", "mine", "smart", "alien"], unlock: 5 },
	ice: { description: "fragmentos congelados e minas camufladas", background: "#0b1d29", accent: "#9ce8ef", enemyRate: .6, enemyTypes: ["rock", "mine", "drone", "smart", "alien"], unlock: 10 }
};
let selectedShip = "scout";
let selectedMap = "orbit";
let selectedWeapon = "pulse";
let selectedPilot = "scout";
let fusionMode = false;
let fusionParts = [];
let fireHeld = false;
const specials = { scout: ["DASH", "avanço invulnerável"], hunter: ["SALVA", "rajada de oito tiros"], titan: ["REPARO", "recupera duas blindagens"], special: ["SALVA", "sete granadas em leque"] };
const state = { score: 0, level: 1, xp: 0, energy: 0, lives: 3, damage: 0, special: 0, specialTime: 30, mechanicTimer: 8, elapsed: 0, paused: false, ended: false, lastTime: 0, spawnTimer: 0, crystalTimer: 0, repairTimer: 0, fireCooldown: 0 };
const player = { x: 0, y: 0, radius: 16, speed: 330, angle: 0, invulnerable: 0 };
let asteroids = [];
let crystals = [];
let bullets = [];
let repairBases = [];
let mechanic = { x: 0, y: 0, glow: 0 };
let allies = [];
let stars = [];
let effects = [];
let audioContext;
let soundEnabled = true;
let screenShake = 0;
let loopRunning = false;

function startAudio() {
	if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
	if (audioContext.state === "suspended") audioContext.resume();
}

function playSound(type) {
	if (!soundEnabled) return;
	startAudio();
	const settings = { laser: [520, .06, "square", .045], hit: [110, .13, "sawtooth", .08], collect: [740, .16, "sine", .06], crash: [70, .38, "sawtooth", .12] }[type];
	if (!settings) return;
	const [frequency, duration, wave, volume] = settings;
	const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
	oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, frequency * .45), audioContext.currentTime + duration);
	gain.gain.setValueAtTime(volume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
	oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
}

function createExplosion(x, y, color, amount = 14) {
	for (let index = 0; index < amount; index += 1) { const angle = Math.random() * Math.PI * 2; const speed = randomBetween(35, 170); effects.push({ type: "spark", x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: randomBetween(.35, .75), maxLife: .75, color, size: randomBetween(1.5, 4) }); }
	for (let index = 0; index < 4; index += 1) effects.push({ type: "smoke", x: x + randomBetween(-8, 8), y: y + randomBetween(-8, 8), vx: randomBetween(-12, 12), vy: randomBetween(-28, -8), life: randomBetween(.45, .8), maxLife: .8, color: "#839199", size: randomBetween(4, 9) });
	screenShake = Math.max(screenShake, amount > 16 ? 9 : 4);
}

function resizeCanvas() {
	const ratio = window.devicePixelRatio || 1;
	const bounds = canvas.getBoundingClientRect();
	canvas.width = Math.floor(bounds.width * ratio);
	canvas.height = Math.floor(bounds.height * ratio);
	context.setTransform(ratio, 0, 0, ratio, 0, 0);
	if (!player.x) { player.x = bounds.width / 2; player.y = bounds.height * .8; }
}

function randomBetween(min, max) { return Math.random() * (max - min) + min; }

function createStars() {
	const bounds = canvas.getBoundingClientRect();
	stars = Array.from({ length: 90 }, () => ({ x: Math.random() * bounds.width, y: Math.random() * bounds.height, size: Math.random() * 1.8 + .3, speed: Math.random() * 24 + 8, alpha: Math.random() * .65 + .2 }));
}

function resetGame() {
	const bounds = canvas.getBoundingClientRect();
	const ship = ships[selectedShip];
	const pilotBonus = selectedShip === "special" ? { scout: 35, hunter: 0, titan: -35 }[selectedPilot] : 0;
	state.score = 0; state.energy = 0; state.lives = ship.lives; state.damage = 0; state.special = 0; state.specialTime = 30; state.mechanicTimer = 8; state.elapsed = 0; state.paused = false; state.ended = false; state.lastTime = 0; state.spawnTimer = .4; state.crystalTimer = .5; state.repairTimer = 4; state.fireCooldown = 0;
	player.x = bounds.width / 2; player.y = bounds.height * .8; player.radius = ship.radius; player.speed = ship.speed + pilotBonus; player.angle = 0; player.invulnerable = 0;
	mechanic = { x: player.x - 34, y: player.y + 12, glow: 0 }; allies = [];
	asteroids = []; crystals = []; bullets = []; effects = []; repairBases = []; fireHeld = false; screenShake = 0;
	gameMessage.hidden = true; pauseMessage.hidden = true; pauseButton.textContent = "Ⅱ";
	updateHud();
	if (!loopRunning) { loopRunning = true; requestAnimationFrame(gameLoop); }
}

function updateHud() {
	scoreElement.textContent = String(state.score).padStart(4, "0");
	levelElement.textContent = state.level;
	xpFill.style.width = `${Math.min(100, state.xp / (state.level * 100) * 100)}%`;
	xpStatus.textContent = `${state.xp} / ${state.level * 100} XP`;
	energyElement.textContent = "∞";
	timerElement.textContent = "∞";
	const emptyArmor = Math.max(0, ships[selectedShip].lives - state.lives);
	livesElement.textContent = `${"● ".repeat(state.lives)}${"○ ".repeat(emptyArmor)}`.trim();
	armorLevelElement.textContent = `${state.lives} / ${ships[selectedShip].lives}`;
	damageReceivedElement.textContent = state.damage;
	healthFill.style.width = `${Math.max(0, state.lives / ships[selectedShip].lives * 100)}%`;
	specialName.textContent = specials[selectedShip][0];
	specialFill.style.width = `${state.special}%`;
	specialStatus.textContent = state.special >= 100 ? "PRONTO · E" : `carrega em ${Math.ceil(state.specialTime)}s`;
	supportStatus.textContent = allies.length ? "EQUIPE ATIVA" : "MECÂNICO";
	supportDetail.textContent = allies.length ? `${allies.length} aliados em campo` : "reparo automático";
}

function gainXp(amount) { state.xp += amount; while (state.xp >= state.level * 100) { state.xp -= state.level * 100; state.level += 1; } }

function spawnAsteroid() {
	const bounds = canvas.getBoundingClientRect();
	const radius = randomBetween(12, 25);
	const type = maps[selectedMap].enemyTypes[Math.floor(Math.random() * maps[selectedMap].enemyTypes.length)];
	const stats = type === "alien" ? { radius: 21, health: 6, speed: randomBetween(80, 125), rotation: randomBetween(-1, 1) } : type === "smart" ? { radius: 16, health: 3, speed: randomBetween(105, 145), rotation: randomBetween(-2, 2) } : type === "drone" ? { radius: 14, health: 1, speed: randomBetween(140, 220), rotation: randomBetween(-3, 3) } : type === "mine" ? { radius: 17, health: 2, speed: randomBetween(70, 115), rotation: randomBetween(-1, 1) } : { radius, health: radius > 20 ? 2 : 1, speed: randomBetween(95, 180), rotation: randomBetween(-2, 2) };
	asteroids.push({ type, x: randomBetween(18, bounds.width - 18), y: -30, ...stats, maxHealth: stats.health, angle: Math.random() * 6.28, seed: Math.random() * 20, vx: 0 });
}

function spawnRepairBase() {
	const bounds = canvas.getBoundingClientRect();
	repairBases.push({ x: randomBetween(35, bounds.width - 35), y: -28, radius: 19, speed: 55, phase: Math.random() * 6.28 });
}

function spawnCrystal() {
	const bounds = canvas.getBoundingClientRect();
	crystals.push({ x: randomBetween(22, bounds.width - 22), y: -20, radius: 8, speed: randomBetween(70, 120), phase: Math.random() * 6.28 });
}

function movePlayer(delta) {
	const bounds = canvas.getBoundingClientRect();
	let horizontal = 0; let vertical = 0;
	if (keys.has("ArrowLeft") || keys.has("a")) horizontal -= 1;
	if (keys.has("ArrowRight") || keys.has("d")) horizontal += 1;
	if (keys.has("ArrowUp") || keys.has("w")) vertical -= 1;
	if (keys.has("ArrowDown") || keys.has("s")) vertical += 1;
	const length = Math.hypot(horizontal, vertical) || 1;
	if (horizontal || vertical) player.angle = Math.atan2(vertical, horizontal) + Math.PI / 2;
	player.x = Math.max(20, Math.min(bounds.width - 20, player.x + horizontal / length * player.speed * delta));
	player.y = Math.max(20, Math.min(bounds.height - 20, player.y + vertical / length * player.speed * delta));
}

function shoot() {
	if (fusionMode && fusionParts.length !== 2) return;
	const weapon = fusionMode ? createFusionWeapon() : weapons[selectedWeapon];
	if (state.fireCooldown > 0 || state.paused || state.ended) return;
	weapon.pattern.forEach(offset => bullets.push({ x: player.x + offset, y: player.y - player.radius, radius: weapon.radius, speed: weapon.speed, damage: weapon.damage, color: weapon.color, weapon: weapon.type, splash: weapon.splash || 0, secondary: weapon.secondary || null }));
	state.fireCooldown = weapon.cooldown;
	playSound("laser");
}

function createFusionWeapon() {
	const first = weapons[fusionParts[0]]; const second = weapons[fusionParts[1]];
	return { name: `${first.name} + ${second.name}`, description: "arma híbrida combinada", cooldown: (first.cooldown + second.cooldown) / 2, speed: (first.speed + second.speed) / 2, damage: first.damage + second.damage, radius: Math.max(first.radius, second.radius), color: first.color, pattern: [...new Set([...first.pattern, ...second.pattern])], type: "fusion", splash: Math.max(first.splash || 0, second.splash || 0), secondary: second.color };
}

function circleHit(first, second) { return Math.hypot(first.x - second.x, first.y - second.y) < first.radius + second.radius; }

function update(delta) {
	state.elapsed += delta; state.fireCooldown = Math.max(0, state.fireCooldown - delta); player.invulnerable = Math.max(0, player.invulnerable - delta); if (state.special < 100) { state.specialTime = Math.max(0, state.specialTime - delta); if (!state.specialTime) state.special = 100; } movePlayer(delta); if (fireHeld) shoot();
	state.spawnTimer -= delta; state.crystalTimer -= delta;
	if (state.spawnTimer <= 0) { spawnAsteroid(); state.spawnTimer = Math.max(.24, maps[selectedMap].enemyRate - state.elapsed * .004); }
	if (state.crystalTimer <= 0) { spawnCrystal(); state.crystalTimer = randomBetween(1.1, 1.8); }
	state.repairTimer -= delta;
	if (state.repairTimer <= 0) { spawnRepairBase(); state.repairTimer = randomBetween(11, 17); }
	const bounds = canvas.getBoundingClientRect();
	mechanic.x += (player.x - 34 - mechanic.x) * delta * 2.5; mechanic.y += (player.y + 12 - mechanic.y) * delta * 2.5; mechanic.glow = Math.max(0, mechanic.glow - delta);
	if (state.level >= 4 && allies.length === 0) { allies = [{ x: player.x - 44, y: player.y + 20, color: "#71e2d3", fire: 0 }, { x: player.x + 44, y: player.y + 20, color: "#ffb06a", fire: .35 }]; repairStatus.textContent = "EQUIPE DE REFORÇO CHEGOU"; }
	allies.forEach(ally => { ally.x += (player.x + (ally.color === "#71e2d3" ? -44 : 44) - ally.x) * delta * 2; ally.y += (player.y + 22 - ally.y) * delta * 2; ally.fire -= delta; if (ally.fire <= 0 && asteroids.length) { bullets.push({ x: ally.x, y: ally.y, radius: 3, speed: 470, damage: 1, color: ally.color, weapon: "bolt" }); ally.fire = .7; } });
	state.mechanicTimer -= delta;
	if (state.mechanicTimer <= 0) { if (state.lives < ships[selectedShip].lives) { state.lives += 1; mechanic.glow = 1.2; repairStatus.textContent = `MECÂNICO: BLINDAGEM ${state.lives} / ${ships[selectedShip].lives}`; } state.mechanicTimer = 8; }
	stars.forEach(star => { star.y += star.speed * delta; if (star.y > bounds.height) star.y = -2; });
	asteroids.forEach(asteroid => {
		asteroid.y += asteroid.speed * delta; asteroid.angle += asteroid.rotation * delta;
		if (asteroid.type === "drone") asteroid.x += Math.sin(state.elapsed * 4 + asteroid.seed) * 35 * delta;
		if (asteroid.type === "smart") { const predictedX = player.x + (keys.has("ArrowRight") || keys.has("d") ? 35 : keys.has("ArrowLeft") || keys.has("a") ? -35 : 0); asteroid.vx += Math.max(-95, Math.min(95, (predictedX - asteroid.x) * .7)) * delta; asteroid.vx *= .985; asteroid.x += asteroid.vx * delta; }
		if (asteroid.type === "alien") { asteroid.vx += Math.max(-70, Math.min(70, (player.x - asteroid.x) * .45)) * delta; asteroid.vx *= .99; asteroid.x += asteroid.vx * delta; }
	});
	crystals.forEach(crystal => { crystal.y += crystal.speed * delta; crystal.phase += delta * 5; });
	repairBases.forEach(base => { base.y += base.speed * delta; base.phase += delta * 3; });
	bullets.forEach(bullet => { bullet.y -= bullet.speed * delta; });
	effects.forEach(effect => { effect.x += effect.vx * delta; effect.y += effect.vy * delta; effect.vy += effect.type === "smoke" ? -4 * delta : 90 * delta; effect.life -= delta; });
	effects = effects.filter(effect => effect.life > 0);
	screenShake = Math.max(0, screenShake - delta * 28);
	asteroids = asteroids.filter(asteroid => asteroid.y < bounds.height + 40);
	crystals = crystals.filter(crystal => crystal.y < bounds.height + 30);
	repairBases = repairBases.filter(base => base.y < bounds.height + 35);
	bullets = bullets.filter(bullet => bullet.y > -20);
	bullets = bullets.filter(bullet => {
		const target = asteroids.find(asteroid => circleHit(bullet, asteroid));
		if (!target) return true;
		target.health -= bullet.damage;
		createExplosion(bullet.x, bullet.y, bullet.color, target.health <= 0 ? 12 : 5);
		playSound(target.health <= 0 ? "hit" : "laser");
		if (bullet.splash) { asteroids.forEach(asteroid => { if (asteroid !== target && Math.hypot(asteroid.x - target.x, asteroid.y - target.y) < bullet.splash) asteroid.health -= 1; }); createExplosion(target.x, target.y, bullet.color, 20); }
		if (target.health <= 0) { asteroids = asteroids.filter(asteroid => asteroid !== target); state.score += 25; gainXp(target.type === "alien" ? 45 : target.type === "smart" ? 30 : 15); }
		return false;
	});
	crystals = crystals.filter(crystal => { if (circleHit(player, crystal)) { state.energy += 1; state.score += 100; gainXp(10); playSound("collect"); createExplosion(crystal.x, crystal.y, "#71e2d3", 8); return false; } return true; });
	repairBases = repairBases.filter(base => { if (circleHit(player, base)) { state.lives = Math.min(ships[selectedShip].lives, state.lives + 1); state.score += 50; playSound("collect"); createExplosion(base.x, base.y, "#9ce8ef", 12); return false; } return true; });
	asteroids = asteroids.filter(asteroid => {
		if (player.invulnerable <= 0 && circleHit(player, asteroid)) { state.damage += 1; state.lives -= 1; state.score = Math.max(0, state.score - 50); player.invulnerable = 1.4; player.x = bounds.width / 2; player.y = bounds.height * .8; createExplosion(player.x, player.y, ships[selectedShip].color, state.lives <= 0 ? 28 : 15); playSound(state.lives <= 0 ? "crash" : "hit"); if (state.lives <= 0) finishGame(false); return false; }
		return true;
	});
	updateHud();
}

function draw() {
	const bounds = canvas.getBoundingClientRect();
	context.clearRect(0, 0, bounds.width, bounds.height);
	const map = maps[selectedMap];
	context.fillStyle = map.background; context.fillRect(0, 0, bounds.width, bounds.height);
	if (selectedMap === "nebula") { context.globalAlpha = .18; context.fillStyle = "#ff754f"; context.beginPath(); context.arc(bounds.width * .72, bounds.height * .28, 130, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1; }
	if (selectedMap === "ice") { context.globalAlpha = .25; context.strokeStyle = "#9ce8ef"; context.lineWidth = 1; for (let line = -bounds.height; line < bounds.width; line += 38) { context.beginPath(); context.moveTo(line, 0); context.lineTo(line + bounds.height, bounds.height); context.stroke(); } context.globalAlpha = 1; }
	context.save(); context.translate(randomBetween(-screenShake, screenShake), randomBetween(-screenShake, screenShake));
	stars.forEach(star => { context.globalAlpha = star.alpha; context.fillStyle = map.accent; context.fillRect(star.x, star.y, star.size, star.size); }); context.globalAlpha = 1;
	crystals.forEach(crystal => { context.save(); context.translate(crystal.x, crystal.y); context.rotate(crystal.phase); context.fillStyle = "#71e2d3"; context.shadowColor = "#71e2d3"; context.shadowBlur = 15; context.beginPath(); context.moveTo(0, -crystal.radius); context.lineTo(crystal.radius * .7, 0); context.lineTo(0, crystal.radius); context.lineTo(-crystal.radius * .7, 0); context.closePath(); context.fill(); context.restore(); });
	repairBases.forEach(base => { context.save(); context.translate(base.x, base.y); context.rotate(base.phase); context.strokeStyle = "#9ce8ef"; context.fillStyle = "#143a49"; context.shadowColor = "#9ce8ef"; context.shadowBlur = 14; context.lineWidth = 2; context.beginPath(); context.arc(0, 0, base.radius, 0, Math.PI * 2); context.fill(); context.stroke(); context.beginPath(); context.moveTo(-11, 0); context.lineTo(11, 0); context.moveTo(0, -11); context.lineTo(0, 11); context.stroke(); context.restore(); });
	context.save(); context.translate(mechanic.x, mechanic.y); context.fillStyle = "#9ce8ef"; context.shadowColor = "#9ce8ef"; context.shadowBlur = mechanic.glow ? 18 : 7; context.beginPath(); context.arc(0, 0, 9, 0, Math.PI * 2); context.fill(); context.fillStyle = "#143a49"; context.fillRect(-5, -1, 10, 2); context.fillRect(-1, -5, 2, 10); context.restore();
	allies.forEach(ally => { context.save(); context.translate(ally.x, ally.y); context.fillStyle = ally.color; context.beginPath(); context.moveTo(0, -12); context.lineTo(9, 8); context.lineTo(0, 4); context.lineTo(-9, 8); context.closePath(); context.fill(); context.restore(); });
	asteroids.forEach(asteroid => { context.save(); context.translate(asteroid.x, asteroid.y); context.rotate(asteroid.angle); context.fillStyle = asteroid.health < asteroid.maxHealth ? "#704c45" : asteroid.type === "alien" ? "#4e2459" : asteroid.type === "smart" ? "#6b315a" : asteroid.type === "mine" ? "#593a4d" : asteroid.type === "drone" ? "#294f58" : "#53616a"; context.strokeStyle = asteroid.type === "alien" ? "#ff8be8" : asteroid.type === "smart" ? "#e48bff" : asteroid.type === "mine" ? "#ff754f" : "#a7b1ab"; context.lineWidth = 1.5; context.beginPath(); if (asteroid.type === "alien") { context.moveTo(0, -asteroid.radius); context.lineTo(asteroid.radius * .78, -asteroid.radius * .25); context.lineTo(asteroid.radius * .65, asteroid.radius); context.lineTo(0, asteroid.radius * .58); context.lineTo(-asteroid.radius * .65, asteroid.radius); context.lineTo(-asteroid.radius * .78, -asteroid.radius * .25); } else if (asteroid.type === "smart") { context.moveTo(0, -asteroid.radius); context.lineTo(asteroid.radius * .75, -asteroid.radius * .35); context.lineTo(asteroid.radius, asteroid.radius * .55); context.lineTo(0, asteroid.radius * .82); context.lineTo(-asteroid.radius, asteroid.radius * .55); context.lineTo(-asteroid.radius * .75, -asteroid.radius * .35); } else if (asteroid.type === "drone") { context.moveTo(0, -asteroid.radius); context.lineTo(asteroid.radius, 0); context.lineTo(0, asteroid.radius); context.lineTo(-asteroid.radius, 0); } else if (asteroid.type === "mine") { for (let point = 0; point < 12; point += 1) { const radius = point % 2 ? asteroid.radius * .7 : asteroid.radius; const angle = point * Math.PI / 6; context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } } else { for (let point = 0; point < 8; point += 1) { const radius = asteroid.radius * (point % 2 ? .82 : 1); const angle = point * Math.PI / 4; context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } } context.closePath(); context.fill(); context.stroke(); if (asteroid.type === "alien") { context.fillStyle = "#ff8be8"; context.beginPath(); context.arc(-6, -2, 3, 0, Math.PI * 2); context.arc(6, -2, 3, 0, Math.PI * 2); context.fill(); } if (asteroid.type === "smart") { context.fillStyle = "#e48bff"; context.beginPath(); context.arc(0, 0, 3, 0, Math.PI * 2); context.fill(); } if (asteroid.health < asteroid.maxHealth) { context.strokeStyle = "#ffb06a"; context.lineWidth = 2; context.beginPath(); context.moveTo(-asteroid.radius * .55, -asteroid.radius * .65); context.lineTo(-asteroid.radius * .08, 0); context.lineTo(-asteroid.radius * .4, asteroid.radius * .66); context.moveTo(-asteroid.radius * .08, 0); context.lineTo(asteroid.radius * .45, asteroid.radius * .42); context.stroke(); } context.restore(); });
	bullets.forEach(bullet => { context.fillStyle = bullet.color; context.shadowColor = bullet.color; context.shadowBlur = bullet.weapon === "beam" ? 26 : bullet.weapon === "plasma" || bullet.weapon === "fusion" ? 22 : bullet.weapon === "rocket" || bullet.weapon === "grenade" ? 16 : 12; if (bullet.weapon === "beam") { context.fillRect(bullet.x - 5, bullet.y - 18, 10, 25); } else if (bullet.weapon === "plasma" || bullet.weapon === "fusion") { context.beginPath(); context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2); context.fill(); if (bullet.secondary) { context.fillStyle = bullet.secondary; context.beginPath(); context.arc(bullet.x, bullet.y, bullet.radius * .45, 0, Math.PI * 2); context.fill(); } } else if (bullet.weapon === "rocket" || bullet.weapon === "grenade") { context.beginPath(); context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2); context.fill(); context.fillStyle = "#ff754f"; context.fillRect(bullet.x - 2, bullet.y + 5, 4, 7); } else { context.fillRect(bullet.x - 2, bullet.y - 8, 4, 12); } context.shadowBlur = 0; });
	effects.forEach(effect => { context.globalAlpha = Math.max(0, effect.life / effect.maxLife); context.fillStyle = effect.color; if (effect.type === "smoke") { context.beginPath(); context.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2); context.fill(); } else { context.fillRect(effect.x, effect.y, effect.size, effect.size); } }); context.globalAlpha = 1;
	if (player.invulnerable <= 0 || Math.floor(player.invulnerable * 10) % 2 === 0) { const ship = ships[selectedShip]; context.save(); context.translate(player.x, player.y); context.fillStyle = ship.color; context.shadowColor = ship.color; context.shadowBlur = 18; context.beginPath(); if (ship.shape === "special") { context.moveTo(0, -24); context.lineTo(12, -9); context.lineTo(24, 5); context.lineTo(9, 9); context.lineTo(0, 20); context.lineTo(-9, 9); context.lineTo(-24, 5); context.lineTo(-12, -9); } else if (ship.shape === "hunter") { context.moveTo(0, -20); context.lineTo(16, 6); context.lineTo(8, 15); context.lineTo(0, 8); context.lineTo(-8, 15); context.lineTo(-16, 6); } else if (ship.shape === "titan") { context.moveTo(-18, -12); context.lineTo(18, -12); context.lineTo(21, 12); context.lineTo(-21, 12); } else { context.moveTo(0, -20); context.lineTo(14, 14); context.lineTo(0, 9); context.lineTo(-14, 14); } context.closePath(); context.fill(); context.fillStyle = "#10181e"; context.beginPath(); context.arc(0, -5, 4, 0, Math.PI * 2); context.fill(); context.restore(); }
	const healthRatio = Math.max(0, state.lives / ships[selectedShip].lives);
	const barWidth = Math.max(44, player.radius * 2.8);
	const barX = player.x - barWidth / 2;
	const barY = player.y - player.radius - 14;
	context.fillStyle = "rgba(5, 12, 16, .9)";
	context.fillRect(barX, barY, barWidth, 5);
	context.fillStyle = healthRatio <= .3 ? "#e34b5b" : healthRatio <= .6 ? "#ff754f" : "#d7f36b";
	context.fillRect(barX, barY, barWidth * healthRatio, 5);
	context.strokeStyle = "#9aa9a9";
	context.lineWidth = 1;
	context.strokeRect(barX, barY, barWidth, 5);
	context.restore();
}

function gameLoop(timestamp) { if (state.ended) { loopRunning = false; return; } if (!state.lastTime) state.lastTime = timestamp; const delta = Math.min((timestamp - state.lastTime) / 1000, .05); state.lastTime = timestamp; if (!state.paused) update(delta); draw(); requestAnimationFrame(gameLoop); }

function togglePause() { if (state.ended) return; state.paused = !state.paused; pauseMessage.hidden = !state.paused; pauseButton.textContent = state.paused ? "▶" : "Ⅱ"; if (!state.paused) state.lastTime = 0; }

function finishGame(won) { if (state.ended) return; state.ended = true; messageTitle.textContent = won ? "Campo limpo" : "Nave danificada"; messageText.textContent = won ? `Você coletou ${state.energy} cristais e marcou ${state.score} pontos.` : `Pontuação final: ${state.score}. Tente uma rota mais segura.`; gameMessage.hidden = false; }

window.addEventListener("resize", () => { resizeCanvas(); createStars(); });
window.addEventListener("keydown", event => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "].includes(event.key)) { event.preventDefault(); keys.add(event.key); } if (event.key === " ") fireHeld = true; if (event.key.toLowerCase() === "p") togglePause(); });
window.addEventListener("keyup", event => keys.delete(event.key));
window.addEventListener("keyup", event => { if (event.key === " ") fireHeld = false; });
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", resetGame);
document.querySelectorAll("[data-key]").forEach(button => {
	const key = button.dataset.key;
	button.addEventListener("pointerdown", event => { event.preventDefault(); button.setPointerCapture(event.pointerId); keys.add(key); });
	button.addEventListener("pointerup", event => { event.preventDefault(); keys.delete(key); });
	button.addEventListener("pointercancel", () => keys.delete(key));
});
fireButton.addEventListener("pointerdown", event => { event.preventDefault(); fireButton.setPointerCapture(event.pointerId); fireHeld = true; });
fireButton.addEventListener("pointerup", event => { event.preventDefault(); fireHeld = false; });
fireButton.addEventListener("pointercancel", () => { fireHeld = false; });
soundButton.addEventListener("click", () => { soundEnabled = !soundEnabled; soundButton.textContent = soundEnabled ? "♫" : "×"; soundButton.setAttribute("aria-label", soundEnabled ? "Desligar sons" : "Ligar sons"); if (soundEnabled) { startAudio(); playSound("collect"); } });
shipOptions.forEach(button => button.addEventListener("click", () => { selectedShip = button.dataset.ship; shipOptions.forEach(option => { const selected = option === button; option.classList.toggle("is-selected", selected); option.setAttribute("aria-pressed", selected); }); pilotSelect.hidden = selectedShip !== "special"; if (selectedShip === "special") { selectedWeapon = "machine"; weaponDescription.textContent = weapons.machine.description; weaponOptions.forEach(option => { const selected = option.dataset.weapon === "machine"; option.classList.toggle("is-selected", selected); option.setAttribute("aria-pressed", selected); }); } resetGame(); }));
pilotOptions.forEach(button => button.addEventListener("click", () => { selectedPilot = button.dataset.pilot; pilotOptions.forEach(option => option.classList.toggle("is-selected", option === button)); resetGame(); }));
mapOptions.forEach(button => button.addEventListener("click", () => { selectedMap = button.dataset.map; mapOptions.forEach(option => { const selected = option === button; option.classList.toggle("is-selected", selected); option.setAttribute("aria-pressed", selected); }); mapDescription.textContent = maps[selectedMap].description; resetGame(); }));
weaponOptions.forEach(button => button.addEventListener("click", () => { const weapon = button.dataset.weapon; if (fusionMode) { if (fusionParts.includes(weapon)) fusionParts = fusionParts.filter(part => part !== weapon); else if (fusionParts.length < 2) fusionParts.push(weapon); weaponOptions.forEach(option => { const selected = fusionParts.includes(option.dataset.weapon); option.classList.toggle("is-selected", selected); option.setAttribute("aria-pressed", selected); }); fusionStatus.textContent = fusionParts.length === 2 ? `${weapons[fusionParts[0]].name} + ${weapons[fusionParts[1]].name} prontos` : `escolha ${2 - fusionParts.length} arma(s)`; weaponDescription.textContent = "modo fusão"; return; } selectedWeapon = weapon; weaponOptions.forEach(option => { const selected = option === button; option.classList.toggle("is-selected", selected); option.setAttribute("aria-pressed", selected); }); weaponDescription.textContent = weapons[selectedWeapon].description; }));
fusionButton.addEventListener("click", () => { fusionMode = !fusionMode; fusionParts = []; fusionButton.setAttribute("aria-pressed", fusionMode); weaponOptions.forEach(option => { option.classList.toggle("is-selected", !fusionMode && option.dataset.weapon === selectedWeapon); option.setAttribute("aria-pressed", !fusionMode && option.dataset.weapon === selectedWeapon); }); fusionStatus.textContent = fusionMode ? "escolha duas armas no arsenal" : "selecione duas armas para criar uma híbrida"; weaponDescription.textContent = fusionMode ? "modo fusão" : weapons[selectedWeapon].description; });

resumeButton.addEventListener("click", togglePause);
specialButton.addEventListener("pointerdown", event => { event.preventDefault(); if (state.special < 100) return; state.special = 0; state.specialTime = 30; if (selectedShip === "scout") { player.invulnerable = 2; player.y = Math.max(25, player.y - 90); } else if (selectedShip === "titan") state.lives = Math.min(ships[selectedShip].lives, state.lives + 2); else { for (let index = 0; index < 7; index += 1) bullets.push({ x: player.x + (index - 3) * 12, y: player.y - player.radius, radius: 7, speed: 300, damage: 3, color: ships[selectedShip].color, weapon: "grenade", splash: 70 }); } repairStatus.textContent = `${specials[selectedShip][0]}: ${specials[selectedShip][1]}`; });
window.addEventListener("keydown", event => { if (event.key.toLowerCase() === "e" && state.special >= 100) specialButton.dispatchEvent(new PointerEvent("pointerdown")); });
shipOptions.forEach(button => button.addEventListener("click", () => { if (button.dataset.ship === "special" && state.level < 20) { repairStatus.textContent = "AURORA BLOQUEADA: alcance o nível 20"; return; } }));
mapOptions.forEach(button => button.addEventListener("click", () => { if (state.level < maps[button.dataset.map].unlock) { repairStatus.textContent = `MAPA BLOQUEADO: alcance o nível ${maps[button.dataset.map].unlock}`; } }));

resizeCanvas(); createStars(); resetGame();