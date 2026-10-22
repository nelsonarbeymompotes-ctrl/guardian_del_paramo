// --- JUEGO GUARDIÁN DEL PÁRAMO 3D - I.E. MANUEL MARÍA MOSQUERA ---
let scene, camera, renderer;
let players = [];
let dogGuardians = [];
let hunters = [];
let wildAnimals = [];
let environmentObjects = [];
let projectiles = [];

let gameConfig = {
    mode: 'campaign', // 'campaign' o 'freeroam'
    playersMode: 'single', // 'single' o 'multi'
    difficulty: 'normal',
    currentLevel: 1,
    maxLevels: 3,
    isPaused: false
};

const levelData = [
    {
        title: "NIVEL 1: Valle de los Frailejones",
        subtitle: "Hábitat Protegido del Oso de Anteojos",
        bgHex: 0x0f172a,
        hunterCount: 5,
        animalType: 'bear',
        fact: "En la I.E. Manuel María Mosquera aprendemos que el Oso de Anteojos (Tremarctos ornatus) es el guardián de la diversidad en Puracé, pues al comer frutos dispersa las semillas de robles y frailejones.",
        question: "¿Cuál es la función ecológica del Oso de Anteojos en Puracé?",
        options: [
            "Dispersar semillas para regenerar la vegetación del páramo",
            "Controlar la población de peces en los ríos",
            "Construir diques de piedra en las quebradas"
        ],
        correct: 0
    },
    {
        title: "NIVEL 2: Termales de San Juan",
        subtitle: "Santuario de la Danta de Montaña",
        bgHex: 0x064e3b,
        hunterCount: 7,
        animalType: 'tapir',
        fact: "La Danta de Montaña (Tapirus pinchaque) vive cerca de las termales de San Juan. En el resguardo indígena de Puracé se instalan cercas vivas y corredores biológicos para proteger su desplazamiento.",
        question: "¿Cómo protege el resguardo indígena el paso de la Danta de Montaña?",
        options: [
            "Mediante corredores de conservación y cercas vivas",
            "Tando la vegetación para ver a los cazadores desde lejos",
            "Construyendo muros de concreto alrededor del territorio"
        ],
        correct: 0
    },
    {
        title: "NIVEL 3: Cumbre del Volcán Puracé",
        subtitle: "Territorio Sagrado Kokonuko",
        bgHex: 0x111827,
        hunterCount: 10,
        animalType: 'both',
        fact: "En la cumbre del Volcán Puracé nacen cuatro ríos principales de Colombia. El cuidado del territorio es un trabajo conjunto entre la Guardia Indígena Kokonuko y Parques Nacionales.",
        question: "¿Quiénes cuidan ancestralmente la naturaleza en Puracé?",
        options: [
            "La Guardia Indígena Kokonuko junto a Parques Nacionales",
            "Empresas privadas de extracción minera",
            "Cazadores comerciales extranjeros"
        ],
        correct: 0
    }
];

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function initFallingLeaves() {
    const container = document.getElementById('leaves-container');
    container.innerHTML = '';
    for(let i = 0; i < 20; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'falling-leaf';
        leaf.style.left = `${Math.random() * 100}%`;
        leaf.style.animationDuration = `${4 + Math.random() * 6}s`;
        leaf.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(leaf);
    }
}

function setPlayMode(mode) {
    gameConfig.mode = mode;
    document.getElementById('mode-campaign').className = `mc-btn py-2.5 text-xs font-black rounded-xl ${mode === 'campaign' ? 'bg-amber-600 border-amber-400' : ''}`;
    document.getElementById('mode-freeroam').className = `mc-btn py-2.5 text-xs font-black rounded-xl ${mode === 'freeroam' ? 'bg-amber-600 border-amber-400' : ''}`;
}

function setPlayersMode(pmode) {
    gameConfig.playersMode = pmode;
    document.getElementById('mode-single').className = `mc-btn py-2 text-xs font-bold rounded-lg ${pmode === 'single' ? 'bg-emerald-700 border-emerald-500' : ''}`;
    document.getElementById('mode-multi').className = `mc-btn py-2 text-xs font-bold rounded-lg ${pmode === 'multi' ? 'bg-emerald-700 border-emerald-500' : ''}`;
    document.getElementById('p2-hud').classList.toggle('hidden', pmode === 'single');
}

function setDifficulty(diff) {
    gameConfig.difficulty = diff;
    ['easy', 'normal', 'hard'].forEach(d => {
        const btn = document.getElementById(`diff-${d === 'normal' ? 'norm' : d}`);
        if(btn) btn.className = `mc-btn py-1.5 text-xs rounded-lg ${diff === d ? 'bg-amber-600 border-amber-400' : ''}`;
    });
}

function initEngine() {
    const canvas = document.getElementById('game-canvas');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 0.9);
    dirLight.position.set(30, 45, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createShirtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 170, 256, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GUARDIÁN', 128, 90);
    ctx.fillText('DEL PÁRAMO', 128, 120);

    return new THREE.CanvasTexture(canvas);
}

function createGokuBackpack() {
    const group = new THREE.Group();

    const mainBag = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.65, 0.35),
        new THREE.MeshLambertMaterial({ color: 0xea580c })
    );
    mainBag.position.y = 0.95;
    mainBag.position.z = 0.28;
    group.add(mainBag);

    const pocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.35, 0.15),
        new THREE.MeshLambertMaterial({ color: 0x1e3a8a })
    );
    pocket.position.set(0, 0.82, 0.48);
    group.add(pocket);

    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = 128;
    patchCanvas.height = 128;
    const pctx = patchCanvas.getContext('2d');
    pctx.fillStyle = '#ffffff';
    pctx.beginPath();
    pctx.arc(64, 64, 58, 0, Math.PI * 2);
    pctx.fill();
    pctx.strokeStyle = '#000000';
    pctx.lineWidth = 6;
    pctx.stroke();

    pctx.fillStyle = '#000000';
    pctx.font = 'bold 50px sans-serif';
    pctx.textAlign = 'center';
    pctx.textBaseline = 'middle';
    pctx.fillText('亀', 64, 66);

    const kanjiTex = new THREE.CanvasTexture(patchCanvas);
    const badge = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 16),
        new THREE.MeshBasicMaterial({ map: kanjiTex, transparent: true })
    );
    badge.position.set(0, 0.98, 0.46);
    badge.rotation.y = Math.PI;
    group.add(badge);

    return group;
}

function createPlayerModel() {
    const group = new THREE.Group();

    const shirtMat = new THREE.MeshLambertMaterial({ map: createShirtTexture() });
    const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.32, 0.95, 12),
        shirtMat
    );
    torso.position.y = 0.9;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    head.position.y = 1.52;
    group.add(head);

    const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12),
        new THREE.MeshLambertMaterial({ color: 0x14532d })
    );
    cap.position.set(0, 1.72, 0);

    const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.04, 0.22),
        new THREE.MeshLambertMaterial({ color: 0x14532d })
    );
    visor.position.set(0, 1.68, -0.22);
    group.add(cap, visor);

    const backpack = createGokuBackpack();
    group.add(backpack);

    const legMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.65, 8), legMat);
    leg1.position.set(-0.16, 0.32, 0);
    const leg2 = leg1.clone();
    leg2.position.set(0.16, 0.32, 0);
    group.add(leg1, leg2);

    return group;
}

function createPlayer(id, posX) {
    const group = createPlayerModel();
    group.position.set(posX, 0, 0);
    scene.add(group);

    return {
        id,
        mesh: group,
        vy: 0,
        isGrounded: false,
        lives: 3,
        score: 0,
        shootCooldown: 0,
        controls: id === 1
            ? { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', dogAttack: 'KeyF' }
            : { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', jump: 'Enter', dogAttack: 'KeyL' }
    };
}

function createDogGuardian(owner) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.2, 0.85, 10),
        new THREE.MeshLambertMaterial({ color: 0xb45309 })
    );
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.42;
    group.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
    );
    head.position.set(0, 0.58, -0.42);

    const snout = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.12, 0.26),
        new THREE.MeshLambertMaterial({ color: 0x1e293b })
    );
    snout.position.set(0, -0.04, -0.16);
    head.add(snout);
    group.add(head);

    group.position.set(owner.mesh.position.x - 1, 0, owner.mesh.position.z);
    scene.add(group);

    return {
        mesh: group,
        owner,
        isAttacking: false,
        targetHunter: null
    };
}

function createBear(x, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 14), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    body.position.y = 0.8;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    head.position.set(0, 1.15, -0.65);

    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), new THREE.MeshLambertMaterial({ color: 0xfef08a }));
    glasses.position.set(0, 0.06, -0.44);
    head.add(glasses);
    group.add(head);

    group.position.set(x, 0, z);
    scene.add(group);
    wildAnimals.push({ mesh: group, type: 'Oso de Anteojos', attackCooldown: 0 });
}

function createTapir(x, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 1.5, 12), new THREE.MeshLambertMaterial({ color: 0x334155 }));
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.68;
    group.add(body);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.75, 10), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    head.rotation.x = -Math.PI / 3;
    head.position.set(0, 0.85, -0.85);
    group.add(head);

    group.position.set(x, 0, z);
    scene.add(group);
    wildAnimals.push({ mesh: group, type: 'Danta de Montaña', attackCooldown: 0 });
}

function createHunter(x, z) {
    const group = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.95, 10), new THREE.MeshLambertMaterial({ color: 0x1e3a1e }));
    torso.position.y = 0.9;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), new THREE.MeshLambertMaterial({ color: 0xfbbf24 }));
    head.position.y = 1.52;
    group.add(head);

    group.position.set(x, 0, z);
    scene.add(group);

    const speed = gameConfig.difficulty === 'easy' ? 0.025 : (gameConfig.difficulty === 'normal' ? 0.045 : 0.065);
    hunters.push({ mesh: group, speed, stunnedTimer: 0 });
}

function buildLevel(lvlNum) {
    environmentObjects.forEach(o => scene.remove(o));
    wildAnimals.forEach(a => scene.remove(a.mesh));
    hunters.forEach(h => scene.remove(h.mesh));
    projectiles.forEach(p => scene.remove(p.mesh));
    environmentObjects = [];
    wildAnimals = [];
    hunters = [];
    projectiles = [];

    const data = levelData[lvlNum - 1];
    scene.background = new THREE.Color(data.bgHex);
    scene.fog.color = new THREE.Color(data.bgHex);

    const mapSize = gameConfig.mode === 'freeroam' ? 120 : 40;

    const floorGeo = new THREE.PlaneGeometry(mapSize, mapSize);
    const floorMat = new THREE.MeshLambertMaterial({ color: lvlNum === 1 ? 0x15803d : (lvlNum === 2 ? 0x0f766e : 0x374151) });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    environmentObjects.push(floor);

    const riverGeo = new THREE.PlaneGeometry(8, mapSize);
    const riverMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.8 });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.02, 0);
    scene.add(river);
    environmentObjects.push(river);

    const treeCount = gameConfig.mode === 'freeroam' ? 35 : 12;
    for(let i = 0; i < treeCount; i++) {
        const treeX = (Math.random() - 0.5) * (mapSize - 10);
        const treeZ = (Math.random() - 0.5) * (mapSize - 10);
        if(Math.abs(treeX) > 4) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), new THREE.MeshLambertMaterial({ color: 0x451a03 }));
            trunk.position.set(treeX, 1.5, treeZ);

            const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshLambertMaterial({ color: 0x166534 }));
            leaves.position.set(treeX, 3.2, treeZ);
            scene.add(trunk, leaves);
            environmentObjects.push(trunk, leaves);
        }
    }

    if (data.animalType === 'bear') createBear(0, -8);
    else if (data.animalType === 'tapir') createTapir(0, -8);
    else { createBear(-4, -8); createTapir(4, -8); }

    if(gameConfig.mode === 'freeroam') {
        createBear(-15, -20);
        createTapir(15, -20);
    }

    const hCount = gameConfig.mode === 'freeroam' ? 12 : data.hunterCount;
    for(let i = 0; i < hCount; i++) {
        const spawnX = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 8);
        const spawnZ = 8 + Math.random() * 8;
        createHunter(spawnX, spawnZ);
    }

    document.getElementById('level-title').innerText = gameConfig.mode === 'freeroam' ? "MODO JUEGO LIBRE" : data.title;
    document.getElementById('level-sub').innerText = gameConfig.mode === 'freeroam' ? "Resguardo Manuel María Mosquera" : data.subtitle;
    document.getElementById('hunters-left').innerText = `🏹 Cazadores: ${hunters.length}`;
}

function shootNet(player) {
    if(player.shootCooldown > 0) return;
    player.shootCooldown = 25;

    const netMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xfacc15, wireframe: true })
    );
    netMesh.position.set(player.mesh.position.x, 1.0, player.mesh.position.z);
    scene.add(netMesh);

    projectiles.push({ mesh: netMesh, dirZ: -0.4, life: 45 });
}

function animate() {
    requestAnimationFrame(animate);

    if(!gameConfig.isPaused && players.length > 0) {
        const pSpeed = 0.13;
        const bounds = gameConfig.mode === 'freeroam' ? 55 : 18;

        players.forEach((p, idx) => {
            if(p.lives <= 0) return;
            if(p.shootCooldown > 0) p.shootCooldown--;

            if(keys[p.controls.left]) p.mesh.position.x -= pSpeed;
            if(keys[p.controls.right]) p.mesh.position.x += pSpeed;
            if(keys[p.controls.up]) p.mesh.position.z -= pSpeed;
            if(keys[p.controls.down]) p.mesh.position.z += pSpeed;

            if(keys[p.controls.jump]) shootNet(p);

            p.mesh.position.x = Math.max(-bounds, Math.min(bounds, p.mesh.position.x));
            p.mesh.position.z = Math.max(-bounds, Math.min(bounds, p.mesh.position.z));

            const dog = dogGuardians[idx];
            if(dog && !dog.isAttacking) {
                dog.mesh.position.lerp(new THREE.Vector3(p.mesh.position.x - 0.9, 0, p.mesh.position.z + 0.9), 0.12);
            }

            if(keys[p.controls.dogAttack] && dog && !dog.isAttacking && hunters.length > 0) {
                let closestHunter = null;
                let minDist = 999;
                hunters.forEach(h => {
                    const dist = dog.mesh.position.distanceTo(h.mesh.position);
                    if(dist < minDist) { minDist = dist; closestHunter = h; }
                });
                if(closestHunter && minDist < 12) {
                    dog.isAttacking = true;
                    dog.targetHunter = closestHunter;
                }
            }

            hunters.forEach((h, hIdx) => {
                if(p.mesh.position.distanceTo(h.mesh.position) < 1.0) {
                    scene.remove(h.mesh);
                    hunters.splice(hIdx, 1);
                    p.score++;
                    updateHUD();
                    checkLevelCompletion();
                }
            });
        });

        projectiles.forEach((pr, prIdx) => {
            pr.mesh.position.z += pr.dirZ;
            pr.life--;

            hunters.forEach((h, hIdx) => {
                if(pr.mesh.position.distanceTo(h.mesh.position) < 1.1) {
                    scene.remove(h.mesh);
                    scene.remove(pr.mesh);
                    hunters.splice(hIdx, 1);
                    projectiles.splice(prIdx, 1);
                    players[0].score++;
                    updateHUD();
                    checkLevelCompletion();
                }
            });

            if(pr.life <= 0) {
                scene.remove(pr.mesh);
                projectiles.splice(prIdx, 1);
            }
        });

        dogGuardians.forEach(dog => {
            if(dog.isAttacking && dog.targetHunter) {
                dog.mesh.position.lerp(dog.targetHunter.mesh.position, 0.22);
                if(dog.mesh.position.distanceTo(dog.targetHunter.mesh.position) < 0.7) {
                    dog.targetHunter.stunnedTimer = 140;
                    dog.isAttacking = false;
                    dog.targetHunter = null;
                }
            }
        });

        hunters.forEach(h => {
            if(h.stunnedTimer > 0) {
                h.stunnedTimer--;
                h.mesh.rotation.y += 0.25;
                return;
            }

            if(wildAnimals.length > 0) {
                const target = wildAnimals[0];
                const dir = new THREE.Vector3().subVectors(target.mesh.position, h.mesh.position).normalize();

                h.mesh.position.x += dir.x * h.speed;
                h.mesh.position.z += dir.z * h.speed;
                h.mesh.lookAt(target.mesh.position);

                if(h.mesh.position.distanceTo(target.mesh.position) < 0.9) {
                    triggerGameOver(`¡Un cazador alcanzó a la fauna sagrada! Defiende la reserva de la I.E. Manuel María Mosquera.`);
                }
            }
        });

        if(players.length === 1) {
            camera.position.set(players[0].mesh.position.x, players[0].mesh.position.y + 10, players[0].mesh.position.z + 12);
            camera.lookAt(players[0].mesh.position);
        }
    }

    renderer.render(scene, camera);
}

function updateHUD() {
    players.forEach(p => {
        const heartsDiv = document.getElementById(p.id === 1 ? 'p1-hearts' : 'p2-hearts');
        const scoreP = document.getElementById(p.id === 1 ? 'p1-score' : 'p2-score');

        heartsDiv.innerHTML = '';
        for(let i = 0; i < 3; i++) {
            const heart = document.createElement('span');
            heart.className = `heart ${i < p.lives ? '' : 'heart-empty'}`;
            heartsDiv.appendChild(heart);
        }

        scoreP.innerText = `Atrapados: ${p.score}`;
    });

    document.getElementById('hunters-left').innerText = `🏹 Cazadores: ${hunters.length}`;
}

function checkLevelCompletion() {
    if(hunters.length === 0) {
        if(gameConfig.mode === 'campaign') {
            gameConfig.isPaused = true;
            showTriviaModal();
        } else {
            buildLevel(1);
        }
    }
}

function showTriviaModal() {
    const data = levelData[gameConfig.currentLevel - 1];
    document.getElementById('trivia-fact').innerText = data.fact;
    document.getElementById('trivia-question').innerText = data.question;
    document.getElementById('trivia-feedback').innerText = '';
    document.getElementById('trivia-footer-actions').classList.add('hidden');

    const optsDiv = document.getElementById('trivia-options');
    optsDiv.innerHTML = '';

    data.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'mc-btn w-full py-2.5 text-xs text-left px-4 hover:bg-amber-600/80 rounded-xl';
        btn.innerText = `${idx + 1}. ${opt}`;
        btn.onclick = () => answerTrivia(idx, data.correct);
        optsDiv.appendChild(btn);
    });

    document.getElementById('trivia-modal').classList.remove('hidden');
}

function answerTrivia(selectedIndex, correctIndex) {
    const feedback = document.getElementById('trivia-feedback');
    if(selectedIndex === correctIndex) {
        feedback.className = 'text-xs font-semibold text-emerald-400 h-6 mb-2';
        feedback.innerText = '¡Respuesta Correcta! Excelente trabajo pedagógico para la I.E. Manuel María Mosquera.';
        document.getElementById('trivia-footer-actions').classList.remove('hidden');
    } else {
        feedback.className = 'text-xs font-semibold text-red-400 h-6 mb-2';
        feedback.innerText = 'Incorrecto. Revisa la enseñanza e inténtalo de nuevo.';
    }
}

function keepTriviaOpen() {
    document.getElementById('trivia-feedback').innerText = '📖 La enseñanza sigue disponible para repasar en clase.';
}

function proceedToNextLevel() {
    document.getElementById('trivia-modal').classList.add('hidden');
    if(gameConfig.currentLevel < gameConfig.maxLevels) {
        gameConfig.currentLevel++;
        buildLevel(gameConfig.currentLevel);
        updateHUD();
        gameConfig.isPaused = false;
    } else {
        showVictory();
    }
}

function triggerGameOver(reason) {
    gameConfig.isPaused = true;
    document.getElementById('go-title').innerText = '¡FAUNA EN PELIGRO!';
    document.getElementById('go-msg').innerText = reason;
    document.getElementById('gameover-modal').classList.remove('hidden');
}

function showVictory() {
    document.getElementById('go-title').innerText = '¡VICTORIA Y PROTECCIÓN TOTAL!';
    document.getElementById('go-title').className = 'text-xl text-emerald-400 font-bold mb-4';
    document.getElementById('go-msg').innerText = '¡Felicidades Nelson Arbey Mompotes! Has completado con éxito la protección del Parque Nacional Natural Puracé en representación de la Institución Educativa Manuel María Mosquera y el docente Álvaro Stid Bolaños.';
    document.getElementById('gameover-modal').classList.remove('hidden');
}

function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    gameConfig.currentLevel = 1;
    gameConfig.isPaused = false;

    players = [];
    dogGuardians = [];

    const p1 = createPlayer(1, -2);
    players.push(p1);
    dogGuardians.push(createDogGuardian(p1));

    if(gameConfig.playersMode === 'multi') {
        const p2 = createPlayer(2, 2);
        players.push(p2);
        dogGuardians.push(createDogGuardian(p2));
    }

    buildLevel(1);
    updateHUD();
}

function resetToMenu() {
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');

    players.forEach(p => scene.remove(p.mesh));
    dogGuardians.forEach(d => scene.remove(d.mesh));
    wildAnimals.forEach(a => scene.remove(a.mesh));
    hunters.forEach(h => scene.remove(h.mesh));
    environmentObjects.forEach(o => scene.remove(o));

    players = [];
    dogGuardians = [];
    wildAnimals = [];
    hunters = [];
    environmentObjects = [];
}

window.onload = function() {
    initEngine();
    initFallingLeaves();
    animate();
};