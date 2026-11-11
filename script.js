/* global THREE */
(() => {
  const $ = id => document.getElementById(id);
  const ui = {
    container: $('canvas-container'), hud: $('hud'), overlay: $('overlay'),
    title: $('overlay-title'), description: $('overlay-description'),
    controls: $('intro-controls'), button: $('start-button'), status: $('status'),
    health: $('health'), healthFill: $('health-fill'), wave: $('wave'),
    score: $('score'), money: $('money'), enemies: $('enemies'), message: $('wave-message'),
    flash: $('damage-flash'), hit: $('hit-marker'), shop: $('shop'),
    shopMoney: $('shop-money'), shopStatus: $('shop-status'),
    weaponName: $('weapon-name'), weaponDetail: $('weapon-detail'),
    menuButton: $('menu-button'), fullscreenButton: $('fullscreen-button'),
    secretButton: $('secret-button'), pinBoard: $('pin-board'), pinDisplay: $('pin-display'),
    pinStatus: $('pin-status'), timeStatus: $('time-status')
  };

  async function init() {
    let THREE;
    try {
      THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
    } catch (error) {
      console.error('Three.js konnte nicht geladen werden:', error);
      ui.status.textContent = 'Die 3D-Bibliothek konnte nicht geladen werden. Bitte prüfe deine Internetverbindung und lade die Seite neu.';
      ui.button.textContent = 'LADEN FEHLGESCHLAGEN';
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (error) {
      console.error('WebGL konnte nicht gestartet werden:', error);
      ui.status.textContent = '3D konnte nicht gestartet werden. Bitte aktiviere WebGL oder versuche einen anderen Browser.';
      ui.button.textContent = '3D NICHT VERFÜGBAR';
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    ui.container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x99b9c9);
    scene.fog = new THREE.Fog(0x99b9c9, 35, 100);
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 150);
    camera.rotation.order = 'YXZ';
    scene.add(new THREE.HemisphereLight(0xd7faff, 0x394252, 2));
    const sun = new THREE.DirectionalLight(0xffe6c6, 2);
    sun.position.set(-15, 35, 15);
    scene.add(sun);

    const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
    const groundMat = material(0x53616b);
    const roadMat = material(0x394850);
    const lineMat = material(0xd6c890);
    const buildings = [material(0x435768), material(0x596c78), material(0x667783), material(0x384c5c)];
    const trimMat = material(0x263e48);
    const windowMat = material(0x79c4bc, { emissive: 0x376b69, emissiveIntensity: 0.4 });
    const crateMat = material(0x947b62);
    const neonMat = material(0x5ff5d0, { emissive: 0x31a789, emissiveIntensity: 1 });
    const obstacles = [];
    const coverMeshes = [];

    function box(x, y, z, width, height, depth, mat, solid = false) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      if (solid) {
        obstacles.push({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
        coverMeshes.push(mesh);
      }
      return mesh;
    }

    box(0, -0.5, 0, 76, 1, 76, groundMat);
    box(0, 0.01, 0, 14, 0.02, 76, roadMat);
    box(0, 0.02, 0, 76, 0.02, 14, roadMat);
    for (let i = -32; i <= 32; i += 8) {
      if (Math.abs(i) > 8) {
        box(0, 0.04, i, 0.18, 0.02, 3, lineMat);
        box(i, 0.04, 0, 3, 0.02, 0.18, lineMat);
      }
    }

    const cityBlocks = [
      [-27, -27, 12, 12, 17], [-13, -27, 9, 12, 11], [14, -27, 10, 12, 19], [28, -27, 10, 12, 13],
      [-27, -13, 12, 9, 10], [-13, -13, 9, 9, 15], [14, -13, 10, 9, 12], [28, -13, 10, 9, 18],
      [-27, 14, 12, 10, 16], [-13, 14, 9, 10, 11], [14, 14, 10, 10, 17], [28, 14, 10, 10, 12],
      [-27, 28, 12, 10, 12], [-13, 28, 9, 10, 18], [14, 28, 10, 10, 13], [28, 28, 10, 10, 16]
    ];
    cityBlocks.forEach(([x, z, w, d, h], index) => {
      box(x, h / 2, z, w, h, d, buildings[index % buildings.length], true);
      box(x, h + 0.15, z, w + 0.3, 0.3, d + 0.3, trimMat);
      for (let y = 2.5; y < h - 1; y += 3) {
        for (let offset = -w / 2 + 1.5; offset < w / 2 - 0.5; offset += 2.5) {
          box(x + offset, y, z + d / 2 + 0.02, 1.1, 1.3, 0.04, windowMat);
          box(x + offset, y, z - d / 2 - 0.02, 1.1, 1.3, 0.04, windowMat);
        }
      }
    });
    [[-4, -15], [4, -23], [-4, 17], [4, 26], [-19, -4], [-27, 4], [19, 4], [27, -4], [-3, 5], [4, -5]].forEach(([x, z], i) => {
      box(x, 0.75, z, 2.4, 1.5, 2.4, crateMat, true);
      box(x, 1.52, z, 2.45, 0.08, 2.45, i % 2 ? trimMat : neonMat);
    });
    // Low walls enclose the playable area without blocking the skyline.
    box(0, 1, -37, 76, 2, 1, trimMat, true);
    box(0, 1, 37, 76, 2, 1, trimMat, true);
    box(-37, 1, 0, 1, 2, 76, trimMat, true);
    box(37, 1, 0, 1, 2, 76, trimMat, true);

    const gun = new THREE.Group();
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.65), material(0x263741, { metalness: 0.4 }));
    gunBody.position.set(0, 0, -0.25);
    const gunTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.4), neonMat);
    gunTop.position.set(0, 0.13, -0.3);
    const gunBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.28), trimMat);
    gunBarrel.position.set(0, 0.01, -0.66);
    gun.add(gunBody, gunTop, gunBarrel);
    gun.position.set(0.42, -0.37, -0.65);
    camera.add(gun);
    scene.add(camera);

    const enemyTypes = {
      normal: { body: material(0xe46b5d), health: 3, speed: 1, scale: 1, damage: 10, score: 100 },
      fast: { body: material(0xf1d05e), health: 2, speed: 1.6, scale: 0.85, damage: 10, score: 100 },
      armored: { body: material(0x739cdb), health: 8, speed: 0.7, scale: 1.15, damage: 15, score: 200 },
      boss: { body: material(0xb66ee8), health: 24, speed: 0.8, scale: 1.4, damage: 20, score: 500 }
    };
    const enemyDarkMat = material(0x343b49);
    const enemyEyeMat = material(0xffd2a0, { emissive: 0xff6a48, emissiveIntensity: 1 });
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xff765b });
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const bulletGeometry = new THREE.SphereGeometry(0.13, 8, 6);
    const enemies = [];
    const bullets = [];
    const keys = new Set();
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    const groundHeight = 1.65;
    const weapons = {
      pulse: { name: 'IMPULS', number: '01', damage: 1, cooldown: 170, cost: 0, detail: 'UNBEGRENZTE MUNITION' },
      scatter: { name: 'SCATTER', number: '02', damage: 3, cooldown: 520, cost: 750, detail: 'SCHROT · 3 SCHADEN' },
      rapid: { name: 'RAPID', number: '03', damage: 1, cooldown: 75, cost: 1200, detail: 'SCHNELLFEUER · 1 SCHADEN' },
      carbine: { name: 'CARBINE', number: '04', damage: 2, cooldown: 140, cost: 1500, detail: 'STURMGEWEHR · 2 SCHADEN' },
      twin: { name: 'TWIN', number: '05', damage: 2, cooldown: 420, cost: 2000, detail: 'DOPPELSCHUSS · 2 × 2 SCHADEN' },
      rail: { name: 'RAIL', number: '06', damage: 3, cooldown: 800, cost: 2800, detail: 'DURCHSCHLAG · 3 SCHADEN' }
    };
    const progressKey = 'neon-district-weapons';
    function loadProgress() {
      try {
        const saved = JSON.parse(localStorage.getItem(progressKey) || '{}');
        const ownedWeapons = new Set(['pulse']);
        if (Array.isArray(saved.ownedWeapons)) {
          saved.ownedWeapons.forEach(id => {
            if (Object.prototype.hasOwnProperty.call(weapons, id)) ownedWeapons.add(id);
          });
        }
        const money = Number.isSafeInteger(saved.money) && saved.money >= 0 ? saved.money : 0;
        return { ownedWeapons, weapon: ownedWeapons.has(saved.weapon) ? saved.weapon : 'pulse', money, timeUnlocked: saved.timeUnlocked === true };
      } catch (error) {
        console.error('Gespeicherter Spielfortschritt konnte nicht geladen werden:', error);
        return { ownedWeapons: new Set(['pulse']), weapon: 'pulse', money: 0, timeUnlocked: false };
      }
    }
    const savedProgress = loadProgress();
    const player = {
      health: 100, score: 0, money: savedProgress.money, wave: 0, weapon: savedProgress.weapon,
      ownedWeapons: savedProgress.ownedWeapons, timeUnlocked: savedProgress.timeUnlocked,
      yaw: 0, pitch: 0, verticalSpeed: 0
    };
    const state = { started: false, dead: false, locked: false, shopOpen: false, mainMenu: true, shooting: false, timeStopped: false, lastShot: 0, waveDelay: 0, messageUntil: 0, flashUntil: 0, hitUntil: 0 };
    const clock = new THREE.Clock();

    function saveProgress() {
      try {
        localStorage.setItem(progressKey, JSON.stringify({
          ownedWeapons: Array.from(player.ownedWeapons),
          weapon: player.weapon,
          money: player.money,
          timeUnlocked: player.timeUnlocked
        }));
        return true;
      } catch (error) {
        console.error('Spielfortschritt konnte nicht gespeichert werden:', error);
        ui.status.textContent = 'Dein Guthaben und Waffen-Fortschritt konnten nicht gespeichert werden.';
        return false;
      }
    }

    function part(group, x, y, z, w, h, d, mat) {
      const mesh = new THREE.Mesh(enemyGeometry, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      group.add(mesh);
    }

    function isBlocked(x, z, radius = 0.45) {
      return obstacles.some(o => x + radius > o.minX && x - radius < o.maxX && z + radius > o.minZ && z - radius < o.maxZ);
    }

    function moveWithCollision(position, dx, dz, radius) {
      if (!isBlocked(position.x + dx, position.z, radius)) position.x += dx;
      if (!isBlocked(position.x, position.z + dz, radius)) position.z += dz;
    }

    const spawnPoints = [[0, -32], [0, 32], [-32, 0], [32, 0], [-4, -20], [4, 20], [-20, 4], [20, -4]];
    function spawnEnemy(index, type = enemyTypes.normal) {
      const group = new THREE.Group();
      part(group, 0, 1.05, 0, 0.85, 1, 0.48, type.body);
      part(group, 0, 1.82, 0, 0.6, 0.55, 0.55, enemyDarkMat);
      part(group, 0, 1.84, 0.29, 0.4, 0.12, 0.04, enemyEyeMat);
      part(group, -0.28, 0.35, 0, 0.3, 0.7, 0.38, enemyDarkMat);
      part(group, 0.28, 0.35, 0, 0.3, 0.7, 0.38, enemyDarkMat);
      part(group, -0.58, 1.1, 0, 0.25, 0.75, 0.3, enemyDarkMat);
      part(group, 0.58, 1.1, 0, 0.25, 0.75, 0.3, enemyDarkMat);
      const available = spawnPoints.filter(([x, z]) => Math.hypot(x - camera.position.x, z - camera.position.z) > 12);
      const points = available.length ? available : spawnPoints;
      const point = points[index % points.length];
      group.position.set(point[0], 0, point[1]);
      group.scale.setScalar(type.scale);
      scene.add(group);
      enemies.push({ group, type, health: type.health, cooldown: 1.5 + Math.random() * 2, strafe: Math.random() < 0.5 ? -1 : 1 });
    }

    function updateHud() {
      ui.health.textContent = Math.ceil(player.health);
      ui.healthFill.style.width = `${player.health}%`;
      ui.healthFill.style.background = player.health <= 30 ? '#ff746c' : '#6cf4d0';
      ui.wave.textContent = String(player.wave).padStart(2, '0');
      ui.score.textContent = String(player.score).padStart(5, '0');
      ui.money.textContent = `$${String(player.money).padStart(3, '0')}`;
      ui.shopMoney.textContent = `$${String(player.money).padStart(3, '0')}`;
      ui.enemies.textContent = enemies.length;
      const weapon = weapons[player.weapon];
      ui.weaponName.innerHTML = `${weapon.name} <em>${weapon.number}</em>`;
      ui.weaponDetail.textContent = weapon.detail;
      document.querySelectorAll('.weapon-card').forEach(card => {
        const item = weapons[card.dataset.weapon];
        const owned = player.ownedWeapons.has(card.dataset.weapon);
        card.disabled = (!owned && player.money < item.cost) || player.weapon === card.dataset.weapon;
        card.classList.toggle('owned', owned);
        card.classList.toggle('equipped', player.weapon === card.dataset.weapon);
        card.querySelector('b').textContent = player.weapon === card.dataset.weapon ? 'AUSGERÜSTET' : owned ? 'BESITZT' : `$${item.cost}`;
      });
    }

    function showMessage(text, duration = 2.5) {
      ui.message.textContent = text;
      ui.message.style.opacity = '1';
      state.messageUntil = performance.now() + duration * 1000;
    }

    function startWave() {
      player.wave++;
      if (player.wave > 1) player.health = Math.min(100, player.health + 20);
      const count = Math.min(4 + player.wave * 2, 24);
      for (let i = 0; i < count; i++) {
        let type = enemyTypes.normal;
        if (player.wave % 5 === 0 && i === 0) type = enemyTypes.boss;
        else if (player.wave >= 3 && i % 5 === 2) type = enemyTypes.armored;
        else if (player.wave >= 2 && i % 3 === 1) type = enemyTypes.fast;
        spawnEnemy(i, type);
      }
      state.waveDelay = 0;
      const newEnemy = player.wave === 2 ? ' · SCHNELLE GEGNER'
        : player.wave === 3 ? ' · GEPANZERTE GEGNER'
          : player.wave % 5 === 0 ? ' · BOSS' : '';
      showMessage(`WELLE ${player.wave} ${player.wave > 1 ? '· +20 LEBEN' : ''}${newEnemy}`);
      updateHud();
    }

    function openShop() {
      const reward = 250 + (player.wave - 1) * 100;
      player.money += reward;
      saveProgress();
      state.shopOpen = true;
      state.mainMenu = false;
      state.waveDelay = 0;
      state.shooting = false;
      ui.shopStatus.textContent = `+ $${reward} Wellenbelohnung`;
      ui.title.innerHTML = 'WAFFEN<br><span>SHOP</span>';
      ui.description.textContent = `Welle ${player.wave} geschafft! Kaufe eine bessere Waffe und starte danach die nächste Welle.`;
      ui.controls.hidden = true;
      ui.shop.hidden = false;
      ui.menuButton.hidden = false;
      ui.button.innerHTML = 'NÄCHSTE WELLE <span>↗</span>';
      ui.status.textContent = '';
      ui.overlay.hidden = false;
      updateHud();
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
    }

    function continueFromShop() {
      state.shopOpen = false;
      state.mainMenu = false;
      ui.shop.hidden = true;
      ui.menuButton.hidden = true;
      ui.overlay.hidden = true;
      startWave();
      requestPointerLock();
    }

    function showMainMenu() {
      state.shopOpen = false;
      state.mainMenu = true;
      state.shooting = false;
      ui.title.innerHTML = 'NEON<br><span>DISTRICT</span>';
      ui.description.textContent = 'Kaufe und rüste deine Waffen aus. Dein Guthaben und deine Freischaltungen bleiben dauerhaft erhalten.';
      ui.controls.hidden = true;
      ui.shop.hidden = false;
      ui.menuButton.hidden = true;
      const startLabel = state.dead ? 'NEUES SPIEL STARTEN' : player.wave ? 'NÄCHSTE WELLE' : 'SPIEL STARTEN';
      ui.button.innerHTML = `${startLabel} <span>↗</span>`;
      ui.shopStatus.textContent = 'Wähle eine Waffe oder starte die nächste Welle.';
      ui.status.textContent = '';
      ui.overlay.hidden = false;
      ui.hud.hidden = true;
      ui.secretButton.hidden = false;
      updateHud();
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
    }

    function requestPointerLock() {
      try {
        const request = renderer.domElement.requestPointerLock();
        if (request && typeof request.catch === 'function') request.catch(error => {
          console.error('Maussteuerung fehlgeschlagen:', error);
          ui.status.textContent = 'Die Maussteuerung konnte nicht aktiviert werden. Bitte erlaube die Maussteuerung und versuche es erneut.';
        });
      } catch (error) {
        console.error('Maussteuerung fehlgeschlagen:', error);
        ui.status.textContent = 'Die Maussteuerung konnte nicht aktiviert werden. Bitte versuche einen anderen Browser.';
      }
    }

    function clearActors() {
      enemies.forEach(enemy => scene.remove(enemy.group));
      bullets.forEach(bullet => scene.remove(bullet.mesh));
      enemies.length = 0;
      bullets.length = 0;
    }

    function resetGame() {
      clearActors();
      player.health = 100;
      player.score = 0;
      player.wave = 0;
      player.yaw = 0;
      player.pitch = 0;
      player.verticalSpeed = 0;
      camera.position.set(0, groundHeight, 0);
      camera.rotation.set(0, 0, 0);
      state.dead = false;
      state.started = true;
      state.shopOpen = false;
      state.mainMenu = false;
      state.shooting = false;
      state.timeStopped = false;
      ui.timeStatus.hidden = true;
      state.lastShot = 0;
      keys.clear();
      ui.shop.hidden = true;
      ui.menuButton.hidden = true;
      startWave();
    }

    function showOverlay(title, description, button) {
      ui.title.innerHTML = title;
      ui.description.textContent = description;
      ui.controls.hidden = true;
      ui.shop.hidden = true;
      ui.menuButton.hidden = true;
      ui.button.innerHTML = `${button} <span>↗</span>`;
      ui.status.textContent = '';
      ui.overlay.hidden = false;
    }

    function endGame() {
      state.dead = true;
      state.shooting = false;
      showOverlay('GAME<br><span>OVER</span>', `Du hast Welle ${player.wave} erreicht und ${player.score} Punkte gesammelt. Schaffst du beim nächsten Versuch mehr?`, 'NOCHMAL SPIELEN');
      ui.menuButton.hidden = false;
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
    }

    function shoot(now) {
      const weapon = weapons[player.weapon];
      if (now - state.lastShot < weapon.cooldown) return;
      state.lastShot = now;
      gun.position.z = -0.55;
      const angles = player.weapon === 'scatter'
        ? [-0.08, -0.04, 0, 0.04, 0.08]
        : player.weapon === 'twin' ? [-0.015, 0.015] : [0];
      for (const angle of angles) {
        raycaster.setFromCamera(center, camera);
        raycaster.ray.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
        const targets = new Map(enemies.map(enemy => [enemy.group, enemy]));
        const hits = raycaster.intersectObjects([...coverMeshes, ...targets.keys()], true);
        const hitEnemies = new Set();
        for (const hit of hits) {
          let object = hit.object;
          while (object && !targets.has(object)) object = object.parent;
          if (!object) break;
          const enemy = targets.get(object);
          if (hitEnemies.has(enemy)) continue;
          hitEnemies.add(enemy);
          enemy.health -= weapon.damage;
          ui.hit.style.opacity = '1';
          state.hitUntil = now + 130;
          if (enemy.health <= 0) {
            scene.remove(enemy.group);
            enemies.splice(enemies.indexOf(enemy), 1);
            player.score += enemy.type.score;
          }
          if (player.weapon !== 'rail') break;
        }
      }
      updateHud();
    }

    function enemyShoot(enemy, distance) {
      const origin = enemy.group.position.clone().add(new THREE.Vector3(0, 1.35 * enemy.type.scale, 0));
      const target = camera.position.clone();
      target.x += (Math.random() - 0.5) * Math.min(distance * 0.04, 0.8);
      target.z += (Math.random() - 0.5) * Math.min(distance * 0.04, 0.8);
      const direction = target.sub(origin).normalize();
      const mesh = new THREE.Mesh(bulletGeometry, bulletMat);
      mesh.position.copy(origin);
      scene.add(mesh);
      bullets.push({ mesh, velocity: direction.multiplyScalar(12), life: 4, damage: enemy.type.damage });
    }

    function hasLineOfSight(enemy) {
      const origin = enemy.group.position.clone().add(new THREE.Vector3(0, 1.35 * enemy.type.scale, 0));
      const direction = camera.position.clone().sub(origin).normalize();
      raycaster.set(origin, direction);
      const hit = raycaster.intersectObjects(coverMeshes, false)[0];
      return !hit || hit.distance > origin.distanceTo(camera.position);
    }

    function update(dt, now) {
      if (state.locked && !state.dead) {
        const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
        const sideways = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
        const length = Math.hypot(forward, sideways) || 1;
        const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
        const speed = (sprinting ? 11 : 7) * dt / length;
        const dx = (Math.cos(player.yaw) * sideways - Math.sin(player.yaw) * forward) * speed;
        const dz = (-Math.sin(player.yaw) * sideways - Math.cos(player.yaw) * forward) * speed;
        moveWithCollision(camera.position, dx, dz, 0.45);
        player.verticalSpeed -= 20 * dt;
        camera.position.y += player.verticalSpeed * dt;
        if (camera.position.y <= groundHeight) {
          camera.position.y = groundHeight;
          player.verticalSpeed = 0;
        }
        if (state.shooting) shoot(now);
        gun.position.z += (-0.65 - gun.position.z) * Math.min(1, dt * 12);

        for (const enemy of enemies) {
          if (state.timeStopped) break;
          const dx = camera.position.x - enemy.group.position.x;
          const dz = camera.position.z - enemy.group.position.z;
          const distance = Math.hypot(dx, dz) || 1;
          enemy.group.rotation.y = Math.atan2(dx, dz);
          if (distance > 8) {
            const step = Math.min(2.2 + player.wave * 0.07, 3.8) * enemy.type.speed * dt;
            const radius = 0.5 * enemy.type.scale;
            const oldX = enemy.group.position.x;
            const oldZ = enemy.group.position.z;
            moveWithCollision(enemy.group.position, dx / distance * step, dz / distance * step, radius);
            if (Math.abs(enemy.group.position.x - oldX) + Math.abs(enemy.group.position.z - oldZ) < step * 0.1) {
              moveWithCollision(enemy.group.position, -dz / distance * step * enemy.strafe, dx / distance * step * enemy.strafe, radius);
            }
          }
          enemy.cooldown -= dt;
          if (enemy.cooldown <= 0 && distance < 30 && hasLineOfSight(enemy)) {
            enemyShoot(enemy, distance);
            enemy.cooldown = Math.max(0.8, 2.4 - player.wave * 0.05) + Math.random();
          }
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
          if (state.timeStopped) break;
          const bullet = bullets[i];
          bullet.mesh.position.addScaledVector(bullet.velocity, dt);
          bullet.life -= dt;
          const p = bullet.mesh.position;
          const hitPlayer = Math.hypot(p.x - camera.position.x, p.z - camera.position.z) < 0.65 && Math.abs(p.y - camera.position.y) < 0.8;
          if (hitPlayer) {
            player.health = Math.max(0, player.health - bullet.damage);
            ui.flash.style.opacity = '0.35';
            state.flashUntil = now + 140;
            updateHud();
          }
          if (hitPlayer || bullet.life <= 0 || isBlocked(p.x, p.z, 0.1)) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
          }
          if (player.health <= 0) {
            endGame();
            break;
          }
        }
        if (!state.dead && enemies.length === 0 && !state.shopOpen) openShop();
      }
      if (state.messageUntil && now >= state.messageUntil) { ui.message.style.opacity = '0'; state.messageUntil = 0; }
      if (state.flashUntil && now >= state.flashUntil) { ui.flash.style.opacity = '0'; state.flashUntil = 0; }
      if (state.hitUntil && now >= state.hitUntil) { ui.hit.style.opacity = '0'; state.hitUntil = 0; }
      renderer.render(scene, camera);
    }

    ui.button.addEventListener('click', () => {
      ui.secretButton.hidden = true;
      if (state.shopOpen) {
        continueFromShop();
        return;
      }
      if (state.mainMenu) {
        if (state.started && !state.dead) {
          state.mainMenu = false;
          ui.shop.hidden = true;
          ui.overlay.hidden = true;
          startWave();
        } else {
          resetGame();
        }
      } else if (!state.started || state.dead) {
        resetGame();
      }
      ui.status.textContent = '';
      requestPointerLock();
    });

    ui.menuButton.addEventListener('click', showMainMenu);
    ui.secretButton.addEventListener('click', () => {
      ui.pinDisplay.value = '';
      ui.pinStatus.textContent = '';
      ui.pinBoard.showModal();
    });
    function submitPin() {
      if (ui.pinDisplay.value === '2402') {
        player.timeUnlocked = true;
        const saved = saveProgress();
        ui.pinStatus.textContent = saved
          ? 'Zeitstopp freigeschaltet! Drücke im Spiel Alt Gr.'
          : 'Zeitstopp freigeschaltet, aber nicht gespeichert. Drücke im Spiel Alt Gr.';
      } else {
        ui.pinStatus.textContent = 'Falscher PIN. Bitte versuche es erneut.';
      }
      ui.pinDisplay.value = '';
    }
    $('pin-keys').addEventListener('click', event => {
      const digit = event.target.dataset.digit;
      if (digit !== undefined && ui.pinDisplay.value.length < 4) {
        ui.pinDisplay.value += digit;
        ui.pinStatus.textContent = '';
        if (ui.pinDisplay.value.length === 4) submitPin();
      }
    });
    $('pin-clear').addEventListener('click', () => { ui.pinDisplay.value = ''; });
    $('pin-backspace').addEventListener('click', () => {
      ui.pinDisplay.value = ui.pinDisplay.value.slice(0, -1);
    });
    $('pin-close').addEventListener('click', () => {
      ui.pinDisplay.value = '';
      ui.pinBoard.close();
    });
    ui.pinBoard.addEventListener('cancel', () => { ui.pinDisplay.value = ''; });
    ui.pinBoard.addEventListener('close', () => { ui.pinDisplay.value = ''; });

    function updateFullscreenButton() {
      const isFullscreen = document.fullscreenElement === ui.container.parentElement;
      ui.fullscreenButton.textContent = isFullscreen ? 'Vollbild verlassen' : 'Vollbild';
      ui.fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Vollbild verlassen' : 'Vollbild aktivieren');
      ui.fullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
    }

    ui.fullscreenButton.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === ui.container.parentElement) {
          await document.exitFullscreen();
        } else {
          await ui.container.parentElement.requestFullscreen();
        }
        updateFullscreenButton();
      } catch (error) {
        console.error('Vollbildmodus konnte nicht geändert werden:', error);
        ui.status.textContent = 'Der Vollbildmodus konnte nicht aktiviert werden.';
      }
    });
    document.addEventListener('fullscreenchange', updateFullscreenButton);

    document.querySelectorAll('.weapon-card').forEach(card => card.addEventListener('click', () => {
      const weaponId = card.dataset.weapon;
      const weapon = weapons[weaponId];
      const alreadyOwned = player.ownedWeapons.has(weaponId);
      if (!alreadyOwned && player.money < weapon.cost) {
        ui.shopStatus.textContent = `Dir fehlen noch $${weapon.cost - player.money}.`;
        return;
      }
      if (!alreadyOwned) {
        player.money -= weapon.cost;
        player.ownedWeapons.add(weaponId);
      }
      player.weapon = weaponId;
      saveProgress();
      ui.shopStatus.textContent = alreadyOwned
        ? `${weapon.name} ausgerüstet!`
        : `${weapon.name} dauerhaft freigeschaltet und ausgerüstet!`;
      updateHud();
    }));

    document.addEventListener('pointerlockchange', () => {
      state.locked = document.pointerLockElement === renderer.domElement;
      state.shooting = false;
      keys.clear();
      if (state.locked) {
        ui.overlay.hidden = true;
        ui.hud.hidden = false;
        clock.getDelta();
      } else if (state.started && !state.dead && !state.shopOpen) {
        showOverlay('PAUSE<br><span>MODUS</span>', 'Die Arena wartet auf dich. Klicke auf Weiter, um wieder einzusteigen.', 'WEITER SPIELEN');
      }
    });
    document.addEventListener('pointerlockerror', () => {
      ui.status.textContent = 'Die Maussteuerung konnte nicht aktiviert werden. Bitte erlaube die Maussteuerung und versuche es erneut.';
    });
    document.addEventListener('mousemove', event => {
      if (!state.locked) return;
      player.yaw -= event.movementX * 0.002;
      player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - event.movementY * 0.002));
      camera.rotation.set(player.pitch, player.yaw, 0);
    });
    document.addEventListener('keydown', event => {
      if (!state.locked) return;
      if (event.code === 'AltRight' || event.key === 'AltGraph') {
        event.preventDefault();
        if (player.timeUnlocked && !event.repeat) {
          state.timeStopped = !state.timeStopped;
          ui.timeStatus.hidden = !state.timeStopped;
          showMessage(state.timeStopped ? 'ZEIT ANGEHALTEN' : 'ZEIT LÄUFT');
        }
        return;
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space'].includes(event.code)) {
        event.preventDefault();
        if (event.code === 'Space' && !event.repeat && camera.position.y === groundHeight) {
          player.verticalSpeed = 7.5;
        }
        keys.add(event.code);
      }
    });
    document.addEventListener('keyup', event => keys.delete(event.code));
    document.addEventListener('mousedown', event => { if (state.locked && event.button === 0) state.shooting = true; });
    document.addEventListener('mouseup', event => { if (event.button === 0) state.shooting = false; });
    window.addEventListener('blur', () => { keys.clear(); state.shooting = false; });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    camera.position.set(0, 3.2, 6);
    camera.rotation.set(-0.06, Math.PI, 0);
    ui.button.disabled = false;
    showMainMenu();
    ui.status.textContent = 'Am besten am Computer mit Maus und Tastatur spielen.';
    renderer.setAnimationLoop(() => update(Math.min(clock.getDelta(), 0.05), performance.now()));
  }

  init();
})();