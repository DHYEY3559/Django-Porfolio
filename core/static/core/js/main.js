/**
 * DHYEY Pithadia — 3D Driving Portfolio
 * Procedural endless terrain with a car driving left to right.
 * GSAP ScrollTrigger links vertical page scroll to forward movement.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// GSAP variables will be picked up from global scope (loaded via CDN in base.html)

// Game Settings (Modify these to manually change game mechanics)
const GAME_SETTINGS = {
    acceleration: 30,       // Default: 60. Increase for faster acceleration!
    braking: 100,            // Default: 120. Increase for harder brakes.
    maxSpeed: 140,          // Default: 180. The absolute maximum speed limit the car can reach. 
    topSpeedMultiplier: 1.2,  // Default: 3. How fast the game VISUALLY moves! Lower this to 1.0 or 1.5 to make everything feel much slower and more controllable.
    handling: 1,            // Default: 8. How fast the car steers. Lower for smooth Rolls-Royce handling, increase for twitchy.
    grip: 0.99,             // Default: 0.90. How long the car glides before straightening out when letting go of keys. Higher (0.98) = smooth glide, lower (0.8) = instant snap.
    raceDistance: 4000,     // Default: 2000. Increase or decrease for a shorter/longer race.
    aiPlayerWinChance: 0.9, // 0.7 = player wins about 70% of races.
    aiRubberbandStrength: 0.4, // NEW: Default 1.0. Lower to 0.2 making AI catching up/slowing down much smoother.
    offRoadPenalty: 0.95,    // NEW: Default 0.96. The drag applied when you hit the grass. 0.85 is severely punishing!
    curveSharpness: 1.2,     // NEW: Default 1.0. Multiplier for how sharp the road curves are.
};

// Game State
let isJourneyMode = false;
let isGameMode = false;
let raceStarted = false;
let gameSeed = Math.random() * 10000;
let aiCarGroup = null;
let aiWheels = [];
let gameStartX = 0;
let phys = {
    speed: 0, accel: 0, steerVelocity: 0, steerAccel: 0,
    trackOffset: 0 // New: Car local sideways offset from the curved center line
};
let aiSpeed = 0;
let aiTrackOffset = 0;
let aiDestinedToLose = false; // Director flag
let keys = { w: false, a: false, s: false, d: false };

let scene, camera, renderer, composer;
let carGroup, wheels = [];
let environmentGroup; // Holds the trees, rocks
let terrainMesh;
let clock = new THREE.Clock();
let scrollTargetX = 0;

// Drive settings
const SCROLL_DISTANCE = 100; // How far the car drives over the full page scroll
const MOBILE_BREAKPOINT = 768;

// Colors
const PALETTE = {
    carBody: 0xef4444, // Red
    carWindow: 0x111111,
    wheel: 0x1a1a2e,
    hubcap: 0xd1d5db, // Silver
    path: 0xeed3b4, // Warm sunlit path
    terrain: 0x82b842, // Vibrant golden-hour grass
    treeColors: [0x437624, 0x366318, 0x5a9134], // Lush stylized greens
    skyDay: new THREE.Color(0xff8c42), // Deep Sunset Orange
    skyNight: new THREE.Color(0x1e1b4b) // Deep Indigo
};

let sunMesh;
let mainDirLight;

function isCompactViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

function init() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    // Scene setup
    scene = new THREE.Scene();

    // Camera setup - looking at the car from a generic side angle
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Initial camera pos
    camera.position.set(0, 20, 35);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Post-processing and fog (Slowroads golden atmospheric blur)
    scene.background = PALETTE.skyDay.clone();
    scene.fog = new THREE.FogExp2(PALETTE.skyDay, 0.007);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Post-processing setup
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3, 0.4, 0.85
    );
    composer.addPass(bloomPass);

    createLights();
    createEnvironment();
    createProceduralCar();
    // Set initial Day Mode (Golden Hour)
    sunMesh.position.set(100, 40, -80); // Low hanging sunset
    sunMesh.material.color.set(0xffedd5);
    mainDirLight.intensity = 1.0;
    mainDirLight.color.set(0xffedd5);

    // Theme Toggle has been disabled to lock the cinematic aesthetic
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) themeToggleBtn.style.display = 'none';

    setupScrollAnimation();

    window.addEventListener('resize', onResize);

    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('loaded');
    }, 1000);

    animate();
}

// ─── CAMERA & LIGHTS ──────────────────────────────────────
function createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    mainDirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainDirLight.position.set(50, 50, 50);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 2048;
    mainDirLight.shadow.mapSize.height = 2048;
    mainDirLight.shadow.camera.near = 0.5;
    mainDirLight.shadow.camera.far = 200;
    mainDirLight.shadow.camera.left = -50;
    mainDirLight.shadow.camera.right = 50;
    mainDirLight.shadow.camera.top = 50;
    mainDirLight.shadow.camera.bottom = -50;
    mainDirLight.shadow.bias = -0.001;
    scene.add(mainDirLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    fillLight.position.set(-50, -10, -50);
    scene.add(fillLight);

    const sunGeo = new THREE.SphereGeometry(8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    sunMesh.position.copy(mainDirLight.position);
}

// ─── PROCEDURAL ENVIRONMENT ──────────────────────────────
function noise(x, z) {
    x += gameSeed;
    z += gameSeed;
    // Smoothed harmonic curves resembling Slowroads' gentle undulating hills
    return Math.sin(x * 0.02) * Math.cos(z * 0.02) * 8
        + Math.sin(x * 0.01 - z * 0.01) * 12
        + Math.cos(x * 0.05 + z * 0.03) * 2;
}

function getRoadCenter(x) {
    // Generate curved sweeping arcs for the track using long-form sine waves
    return (Math.sin(x * 0.002) * 60 + Math.sin(x * 0.007) * 30) * GAME_SETTINGS.curveSharpness;
}

function getTerrainHeight(x, z) {
    let n = noise(x, z);
    const centerZ = getRoadCenter(x);
    const distToRoad = Math.abs(z - centerZ);
    // Enforce perfectly flat terrain directly under the road width, smooth outwards
    if (distToRoad <= 15) {
        n = noise(x, centerZ);
    } else if (distToRoad < 35) {
        const centerBase = noise(x, centerZ);
        const ratio = (distToRoad - 15) / 20;
        n = THREE.MathUtils.lerp(centerBase, n, Math.pow(ratio, 2));
    }
    return n;
}

function createEnvironment() {
    environmentGroup = new THREE.Group();

    // A massive flat strip going from x=-100 to x=8000 for the race track.
    // Kept to safe vertex buffer limits (prevent vanishing WebGL drops)
    const geo = new THREE.PlaneGeometry(8100, 400, 800, 20);
    geo.rotateX(-Math.PI / 2);
    geo.translate(3900, 0, 0);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        pos.setY(i, getTerrainHeight(x, z));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: PALETTE.terrain,
        flatShading: true,
        roughness: 0.9,
    });

    terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.receiveShadow = true;
    environmentGroup.add(terrainMesh);

    // ─── INSTANCED RENDERING OVERHAUL (PERFORMANCE) ───

    // 1. Road (Continuous Spline Geometry)
    const roadGeo = new THREE.PlaneGeometry(8100, 24, 800, 1);
    roadGeo.rotateX(-Math.PI / 2);
    roadGeo.translate(3900, 0, 0); // Align perfectly with terrain X

    const rPos = roadGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
        const rx = rPos.getX(i);
        let rz = rPos.getZ(i);

        rz += getRoadCenter(rx); // Vector shift road coordinates laterally
        rPos.setZ(i, rz);
        // Inherit exact terrain topography with improved Z-fighting clearance
        rPos.setY(i, getTerrainHeight(rx, rz) + 0.5); // Perfectly adhered & raised comfortably
    }
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
        color: PALETTE.path, roughness: 0.8, flatShading: true,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    });
    const solidRoadMesh = new THREE.Mesh(roadGeo, roadMat);
    solidRoadMesh.receiveShadow = true;
    environmentGroup.add(solidRoadMesh);

    // 2. Trees (Instanced - Leaves & Trunks)
    const treeGeo = new THREE.ConeGeometry(3, 8, 5);
    const treeMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9, color: 0xffffff }); // Color modulated per instance
    const leafMesh = new THREE.InstancedMesh(treeGeo, treeMat, 1500);
    leafMesh.castShadow = true;

    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 3, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2314 });
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, 1500);
    trunkMesh.castShadow = true;

    // 3. Rocks (Instanced)
    const rockGeo = new THREE.DodecahedronGeometry(2); // Scale manipulated via matrix
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, flatShading: true });
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, 650);
    rockMesh.castShadow = true;

    // 4. Pebbles/Particles (Instanced)
    const pebbleGeo = new THREE.DodecahedronGeometry(0.4);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, flatShading: true });
    const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, 1500);
    pebbleMesh.castShadow = true;

    const raycaster = new THREE.Raycaster();
    const dummy = new THREE.Object3D();
    const dummyColor = new THREE.Color();

    // (Road Dirt Instancing removed in favor of continuous geometry above)

    // Populate Trees and Rocks using zero-latency math checks vs Raycasting
    let treeIdx = 0, rockIdx = 0;
    for (let i = 0; i < 2100; i++) {
        const x = Math.random() * 8100 - 50;
        const z = (Math.random() - 0.5) * 350;
        const centerZ = getRoadCenter(x);
        if (Math.abs(z - centerZ) < 25) continue; // Keep wide winding dirt road clear

        const y = noise(x, z); // Instant elevation check

        if (Math.random() > 0.3 && treeIdx < 1500) {
            // Tree
            const scale = 0.6 + Math.random() * 1.5;
            const rotY = Math.random() * Math.PI;
            // Trunk
            dummy.position.set(x, y + 1.5, z);
            dummy.rotation.set(0, rotY, 0);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            trunkMesh.setMatrixAt(treeIdx, dummy.matrix);
            // Leaves
            dummy.position.set(x, y + 5 * scale, z);
            dummy.updateMatrix();
            leafMesh.setMatrixAt(treeIdx, dummy.matrix);

            dummyColor.setHex(PALETTE.treeColors[Math.floor(Math.random() * PALETTE.treeColors.length)]);
            leafMesh.setColorAt(treeIdx, dummyColor);
            treeIdx++;
        } else if (rockIdx < 650) {
            // Rock
            const scale = (1 + Math.random() * 3) / 2;
            dummy.position.set(x, y + 0.5, z);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            rockMesh.setMatrixAt(rockIdx++, dummy.matrix);
        }
    }
    leafMesh.count = treeIdx; trunkMesh.count = treeIdx; rockMesh.count = rockIdx;
    leafMesh.instanceColor.needsUpdate = true;
    environmentGroup.add(leafMesh, trunkMesh, rockMesh);

    // Populate Pebbles
    let pebbleIdx = 0;
    for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 8100 - 50;
        const z = (Math.random() - 0.5) * 350;
        const y = noise(x, z);

        dummy.position.set(x, y + 0.2, z);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.scale.setScalar(0.5 + Math.random() * 0.5);
        dummy.updateMatrix();
        pebbleMesh.setMatrixAt(pebbleIdx++, dummy.matrix);
    }
    pebbleMesh.count = pebbleIdx;
    environmentGroup.add(pebbleMesh);

    scene.add(environmentGroup);
}

// ─── CAR ───────────────────────────────────────────────
function createProceduralCar() {
    carGroup = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.carBody, roughness: 0.3, metalness: 0.6, flatShading: true });
    const windowMat = new THREE.MeshStandardMaterial({ color: PALETTE.carWindow, roughness: 0.1, metalness: 0.9 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: PALETTE.wheel, roughness: 0.9, flatShading: true });
    const hubcapMat = new THREE.MeshStandardMaterial({ color: PALETTE.hubcap, emissive: PALETTE.hubcap, emissiveIntensity: 0.5 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1, 2.2), bodyMat);
    chassis.position.y = 1; chassis.castShadow = true; carGroup.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.8), windowMat);
    cabin.position.set(-0.2, 1.9, 0); cabin.castShadow = true; carGroup.add(cabin);

    const createWheel = (x, z) => {
        const wg = new THREE.Group();
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16), wheelMat);
        tire.rotation.x = Math.PI / 2; tire.castShadow = true; wg.add(tire);
        const hub = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.1), hubcapMat);
        hub.position.z = z > 0 ? 0.21 : -0.21; wg.add(hub);
        wg.position.set(x, 0.6, z); wheels.push(wg); carGroup.add(wg);
    };

    createWheel(1.5, 1.2); createWheel(1.5, -1.2);
    createWheel(-1.4, 1.2); createWheel(-1.4, -1.2);

    carGroup.position.set(0, 0, 0);
    scene.add(carGroup);
}

// ─── SCROLL ──────────────────────────────────────────────
function isKeyboardGameDevice() {
    const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    const hasFinePointer = window.matchMedia('(any-pointer: fine)').matches;
    const hasCoarsePointer = window.matchMedia('(any-pointer: coarse)').matches;
    // Phones are typically touch + coarse pointer + no fine pointer.
    return !(hasTouch && hasCoarsePointer && !hasFinePointer);
}

function scrollToNextCheckpoint() {
    const sections = Array.from(document.querySelectorAll('.scroll-section'));
    const currentY = window.scrollY + 20;
    const nextSection = sections.find(section => section.offsetTop > currentY);

    if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
}

function setupScrollAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true, // `true` instead of `1` seamlessly locks the 3D scene to the DOM scroll without lag
        onUpdate: (self) => {
            const p = self.progress;

            // Smooth-follow this target in the render loop to avoid camera jitter on uneven scroll deltas.
            scrollTargetX = p * SCROLL_DISTANCE;
        }
    });

    gsap.utils.toArray('.scroll-section').forEach(section => {
        gsap.from(section.querySelector('.z-10'), {
            y: 50, opacity: 0, duration: 1,
            scrollTrigger: {
                trigger: section, start: "top 75%", end: "top 25%", scrub: false, toggleActions: "play none none reverse"
            }
        });
    });

    // Auto-Scroll Mechanic
    const startBtn = document.getElementById('start-journey-btn');
    if (startBtn) {
        let autoScrollRAF = null;

        const stopAutoScroll = (manualInterrupt = true) => {
            if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
            autoScrollRAF = null;
            if (manualInterrupt) {
                isJourneyMode = false;
            }
            document.body.style.pointerEvents = ''; // Restore hover events
            document.documentElement.style.scrollBehavior = ''; // Restore native CSS smooth scroll
            window.removeEventListener('wheel', stopAutoScroll);
            window.removeEventListener('touchstart', stopAutoScroll);
            window.removeEventListener('keydown', stopAutoScroll);
        };

        startBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (!isKeyboardGameDevice()) {
                isJourneyMode = false;
                scrollToNextCheckpoint();
                return;
            }

            stopAutoScroll();

            isJourneyMode = true;

            // Disable pointer events on the entire document body 
            // so heavy CSS :hover states don't trigger and crush framerates
            document.body.style.pointerEvents = 'none';
            // Disable CSS smooth scroll purely so it doesn't fight our JS RAF ticks
            document.documentElement.style.scrollBehavior = 'auto';

            // Bind interruption events
            window.addEventListener('wheel', stopAutoScroll, { passive: true });
            window.addEventListener('touchstart', stopAutoScroll, { passive: true });
            window.addEventListener('keydown', stopAutoScroll, { passive: true });

            function scrollStep() {
                window.scrollBy(0, 6.5); // Perfect speed without tearing
                // Stop if hitting the bottom of the document
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                    stopAutoScroll(false); // Natural end
                    if (isJourneyMode && !isGameMode) {
                        initSecretGame();
                    }
                    return;
                }
                autoScrollRAF = requestAnimationFrame(scrollStep);
            }

            // Start loop
            autoScrollRAF = requestAnimationFrame(scrollStep);
        });
    }
}

// ─── SECRET GAME MODE ────────────────────────────────────
function initSecretGame() {
    isGameMode = true;

    // Disconnect GSAP Scroll Sync cleanly
    ScrollTrigger.getAll().forEach(t => t.kill());
    document.getElementById('navbar').style.opacity = '0'; // Cinematic fade

    // Dissolve Portfolio HTML Panels to clear screen for game
    document.querySelectorAll('.scroll-section').forEach(el => {
        el.style.transition = 'opacity 1s ease';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
    });

    // Show Game Rules UI
    document.getElementById('game-ui').classList.remove('hidden');
    document.getElementById('game-rules').classList.remove('hidden');

    // Smooth transition camera (damped sweep)
    const targetCamX = carGroup.position.x - 12;
    const targetCamY = carGroup.position.y + 5;
    const targetCamZ = carGroup.position.z;

    gsap.to(camera.position, {
        x: targetCamX, y: targetCamY, z: targetCamZ,
        duration: 3.5, ease: 'power3.inOut',
        onUpdate: () => {
            camera.lookAt(carGroup.position.x + 30, carGroup.position.y, carGroup.position.z);
        }
    });

    // Spawn AI Competitor (destroy old if resetting)
    if (aiCarGroup) scene.remove(aiCarGroup);
    aiWheels = [];
    aiCarGroup = carGroup.clone();
    aiCarGroup.position.set(carGroup.position.x + 8, carGroup.position.y, carGroup.position.z - 10);
    // Tint AI car visually differently
    aiCarGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            if (child.name === 'chassis') child.material.color.setHex(0xd946ef); // Fuchsia opponent
            if (child.name.includes('tire')) aiWheels.push(child);
        }
    });
    scene.add(aiCarGroup);

    // Bind Controls
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (keys.hasOwnProperty(k)) keys[k] = true;
    });
    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (keys.hasOwnProperty(k)) keys[k] = false;
    });

    // Start Sequence Countdown
    let left = 5;
    const countdownEl = document.getElementById('countdown');
    const interval = setInterval(() => {
        left--;
        countdownEl.innerText = left;
        if (left <= 0) {
            clearInterval(interval);
            document.getElementById('game-rules').classList.add('hidden');
            document.getElementById('game-hud').classList.remove('hidden');
            // GO! Start Engines
            raceStarted = true;
            phys.speed = 0;
            phys.trackOffset = 0;
            aiSpeed = 0;
            aiTrackOffset = -10; // Start slightly to the side
            gameStartX = carGroup.position.x;

            // Configurable chance the game gently lets the player win the final leg
            aiDestinedToLose = Math.random() < Math.max(0, Math.min(1, GAME_SETTINGS.aiPlayerWinChance));

            // Generate 3D Winning Gate
            const endX = gameStartX + GAME_SETTINGS.raceDistance;
            const endZ = getRoadCenter(endX);
            const endY = getTerrainHeight(endX, endZ);

            const gateGroup = new THREE.Group();

            // Pillars
            const pillarGeo = new THREE.CylinderGeometry(1, 1, 15, 8);
            const pillarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
            const p1 = new THREE.Mesh(pillarGeo, pillarMat);
            p1.position.set(0, 7.5, 12);
            p1.castShadow = true;

            const p2 = new THREE.Mesh(pillarGeo, pillarMat);
            p2.position.set(0, 7.5, -12);
            p2.castShadow = true;

            // Banner wrapper
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 128, 64);
            ctx.fillStyle = 'black'; ctx.fillRect(0, 0, 32, 32); ctx.fillRect(32, 32, 32, 32); ctx.fillRect(64, 0, 32, 32); ctx.fillRect(96, 32, 32, 32);
            const checkTex = new THREE.CanvasTexture(canvas);
            checkTex.wrapS = THREE.RepeatWrapping; checkTex.wrapT = THREE.RepeatWrapping;
            checkTex.repeat.set(13, 2);

            const bannerGeo = new THREE.BoxGeometry(2, 4, 26);
            const bannerMat = new THREE.MeshStandardMaterial({ map: checkTex });
            const banner = new THREE.Mesh(bannerGeo, bannerMat);
            banner.position.set(0, 16, 0);
            banner.castShadow = true;

            gateGroup.add(p1, p2, banner);

            gateGroup.position.set(endX, endY, endZ);

            // Align with tangent
            const dz = getRoadCenter(endX + 5) - getRoadCenter(endX - 5);
            gateGroup.rotation.y = -Math.atan2(dz, 10);

            scene.add(gateGroup);
        }
    }, 1000);
}

// ─── LOOP ────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const time = clock.elapsedTime;

    if (carGroup && terrainMesh) {
        if (!isGameMode) {
            const carFollow = 1.0 - Math.exp(-24 * dt);
            carGroup.position.x += (scrollTargetX - carGroup.position.x) * carFollow;
        }

        // Globally align car dynamically to road curvature in all modes
        const centerZ = getRoadCenter(carGroup.position.x);
        carGroup.position.z = centerZ + phys.trackOffset;

        const globalDz = getRoadCenter(carGroup.position.x + 5) - getRoadCenter(carGroup.position.x);
        const globalRotY = -Math.atan2(globalDz, 5);

        // Snap perfectly to mathematical ground (Increased offset for Z-fighting fix)
        const tY = getTerrainHeight(carGroup.position.x, carGroup.position.z);
        const tYFront = getTerrainHeight(carGroup.position.x + 3, carGroup.position.z);
        carGroup.position.y = tY + 0.5; // Ground chassis perfectly flush with wheels

        // Pitch wheel suspension rotation based on slope
        carGroup.rotation.z = Math.atan2(tYFront - tY, 3);

        if (!isGameMode || !raceStarted) {
            carGroup.rotation.y = globalRotY;
        }

        // Idle bobbing
        carGroup.position.y += Math.sin(time * 5) * 0.005;

        if (isGameMode) {
            const dt = 0.016;

            if (raceStarted) {
                if (phys.speed >= 0 || keys.w) {
                    // True Physics Modeling
                    // Acceleration
                    if (keys.w) phys.accel = GAME_SETTINGS.acceleration * dt;
                    else if (keys.s) phys.accel = -GAME_SETTINGS.braking * dt; // Hard brakes
                    else phys.accel = 0;

                    phys.speed += phys.accel;

                    // Track vs Grass Off-Road tire friction physics
                    let currentFriction = 0.992; // Default smooth track
                    if (Math.abs(phys.trackOffset) > 12.5) {
                        currentFriction = GAME_SETTINGS.offRoadPenalty; // Heavy off-road slip penalty
                    }
                    phys.speed *= currentFriction;

                    // Clamp speed bounds
                    phys.speed = Math.max(0, Math.min(phys.speed, GAME_SETTINGS.maxSpeed));

                    // Steering Inertia (Drift mechanics)
                    if (keys.a) phys.steerAccel = -GAME_SETTINGS.handling * dt;
                    else if (keys.d) phys.steerAccel = GAME_SETTINGS.handling * dt;
                    else {
                        phys.steerAccel = 0;
                        phys.steerVelocity *= GAME_SETTINGS.grip; // Return to center grip
                    }

                    phys.steerVelocity += phys.steerAccel;
                    // Clamp max steering angle based on speed (can't turn sharp at >150kph)
                    const steerLimit = Math.max(0.2, 1.5 - (phys.speed / 200));
                    phys.steerVelocity = Math.max(-steerLimit, Math.min(phys.steerVelocity, steerLimit));

                    const speedPerFrame = phys.speed * dt * GAME_SETTINGS.topSpeedMultiplier;

                    // True Manual Uncoupled Steering: The road shifts beneath you. 
                    // If you don't actively steer to compensate (A/D keys), you naturally drive off the edges into the dirt!
                    const shiftDz = getRoadCenter(carGroup.position.x + speedPerFrame) - getRoadCenter(carGroup.position.x);
                    phys.trackOffset -= shiftDz;

                    // Curve local handling mapping
                    phys.trackOffset += phys.steerVelocity * (phys.speed / 40);
                    phys.trackOffset = Math.max(-30, Math.min(phys.trackOffset, 30)); // Give enough width so players can completely fly off the road into grass

                    // True Velocity Heading (Nose points exactly where momentum is carrying it!)
                    const actualDz = phys.steerVelocity * (phys.speed / 40);
                    const actualDx = speedPerFrame || 0.1; // Prevent div zero
                    const trueRotY = -Math.atan2(actualDz, actualDx);

                    // Drift Kinematics
                    const driftAngle = phys.steerVelocity * 0.1; // Kick back end out slightly
                    carGroup.rotation.y = trueRotY - driftAngle;
                    carGroup.rotation.z = phys.steerVelocity * 0.05; // Lean into corners

                    carGroup.position.x += speedPerFrame;

                    const wr = -(carGroup.position.x / 3.14) * Math.PI * 2;
                    wheels.forEach(w => w.rotation.z = wr);
                }

                // AI Logic (Rubber-banding)
                if (aiCarGroup) {
                    const distanceToPlayer = carGroup.position.x - aiCarGroup.position.x;

                    // Base speed randomization (Smoothed out using setting)
                    aiSpeed += (Math.random() - 0.45) * 2 * GAME_SETTINGS.aiRubberbandStrength;

                    // 70% Win-Rate AI Director Logic
                    const totalDist = GAME_SETTINGS.raceDistance;
                    const traveled = carGroup.position.x - gameStartX;

                    if (aiDestinedToLose && traveled > totalDist * 0.70) {
                        // AI artificially slips up in the last 30% of the race 
                        if (distanceToPlayer > 20) aiSpeed += 0.2 * GAME_SETTINGS.aiRubberbandStrength;
                        if (distanceToPlayer < -10) aiSpeed -= 2.0 * GAME_SETTINGS.aiRubberbandStrength;
                    } else {
                        // Normal Aggressive Rubber banding
                        if (distanceToPlayer > 80) aiSpeed += 1.0 * GAME_SETTINGS.aiRubberbandStrength;
                        if (distanceToPlayer < -30) aiSpeed -= 0.8 * GAME_SETTINGS.aiRubberbandStrength;
                    }

                    aiSpeed = Math.max(40, Math.min(aiSpeed, GAME_SETTINGS.maxSpeed - 10)); // AI caps slightly below player max

                    aiCarGroup.position.x += aiSpeed * dt * GAME_SETTINGS.topSpeedMultiplier;

                    // AI Advanced Lane Control Tracking
                    if (Math.random() < 0.01) aiCarGroup.userData.targetZ = Math.max(-20, Math.min(20, (Math.random() - 0.5) * 40));
                    if (aiCarGroup.userData.targetZ !== undefined) {
                        const diff = aiCarGroup.userData.targetZ - aiTrackOffset;
                        aiTrackOffset += diff * 0.03;
                    }

                    const aiCenterZ = getRoadCenter(aiCarGroup.position.x);
                    aiCarGroup.position.z = aiCenterZ + aiTrackOffset;

                    const aiDz = getRoadCenter(aiCarGroup.position.x + 5) - getRoadCenter(aiCarGroup.position.x);
                    aiCarGroup.rotation.y = -Math.atan2(aiDz, 5) - (aiCarGroup.userData.targetZ - aiTrackOffset) * 0.005;

                    // AI Ground tracking perfectly locked to math
                    const aiY = getTerrainHeight(aiCarGroup.position.x, aiCarGroup.position.z);
                    const aiYFront = getTerrainHeight(aiCarGroup.position.x + 3, aiCarGroup.position.z);
                    aiCarGroup.position.y = aiY + 0.5;
                    aiCarGroup.rotation.z = Math.atan2(aiYFront - aiY, 3);

                    const wr = -(aiCarGroup.position.x / 3.14) * Math.PI * 2;
                    aiWheels.forEach(w => w.rotation.z = wr);

                    // HUD Update
                    const distDisplay = Math.floor(distanceToPlayer / 10);
                    document.getElementById('speedo').innerText = Math.floor(phys.speed);
                    document.getElementById('opp-dist').innerText = distDisplay > 0 ? `+${distDisplay}` : `${distDisplay}`;

                    // Win Trigger
                    if (carGroup.position.x >= gameStartX + GAME_SETTINGS.raceDistance || aiCarGroup.position.x >= gameStartX + GAME_SETTINGS.raceDistance) {
                        const playerWon = carGroup.position.x > aiCarGroup.position.x;
                        raceStarted = false; // Freeze physics loops
                        phys.speed = 0; aiSpeed = 0;
                        document.getElementById('game-hud').classList.add('hidden');
                        document.getElementById('game-over').classList.remove('hidden');
                        document.getElementById('end-title').innerText = playerWon ? "YOU WON!" : "YOU LOST.";
                        document.getElementById('end-title').className = playerWon ? "text-5xl font-black text-glow-cyan mb-4 drop-shadow-lg" : "text-5xl font-black text-rose-500 mb-4 drop-shadow-lg";
                    }
                } // END raceStarted
            }

            // High-Performance Camera Damping System
            const tCamX = carGroup.position.x - 12;
            const tCamZ = carGroup.position.z;
            const tCamY = Math.max(carGroup.position.y + 6, getTerrainHeight(carGroup.position.x, carGroup.position.z) + 5);

            // Frame-independent spring damping for buttery smooth tracking
            const camLerpFast = 1.0 - Math.exp(-15 * dt);
            const camLerpSlow = 1.0 - Math.exp(-5 * dt);

            camera.position.x += (tCamX - camera.position.x) * camLerpFast;
            camera.position.z += (tCamZ - camera.position.z) * camLerpSlow; // looser tracking on lane swaps
            camera.position.y += (tCamY - camera.position.y) * camLerpFast;

            // Camera Shake (High Frequency based on speed)
            if (phys.speed > 120) {
                const shakeMod = (phys.speed - 120) * 0.0005;
                camera.position.y += (Math.random() - 0.5) * shakeMod;
                camera.position.z += (Math.random() - 0.5) * shakeMod;
            }

            // Dynamic Speed FOV
            const targetFov = 50 + (phys.speed * 0.15); // Widen field of view at high speeds
            camera.fov += (targetFov - camera.fov) * camLerpSlow;
            camera.updateProjectionMatrix();

            camera.lookAt(carGroup.position.x + 40, carGroup.position.y - 2, carGroup.position.z);

        } else {
            // Standard Drone Portfolio Camera
            const compact = isCompactViewport();
            const idealCamX = carGroup.position.x - (compact ? 2.5 : 5);
            const idealCamZ = carGroup.position.z + (compact ? 24 : 35); // Tighter POV on mobile to keep the car in frame
            const idealCamY = carGroup.position.y + (compact ? 11 : 18);
            const targetLookAhead = compact ? 5 : 10;
            const targetFov = compact ? 60 : 50;
            const camFollow = 1.0 - Math.exp(-20 * dt);
            const fovFollow = 1.0 - Math.exp(-18 * dt);

            const wr = -(carGroup.position.x / 3.14) * Math.PI * 2;
            wheels.forEach(w => { w.rotation.z = wr; });

            camera.position.x += (idealCamX - camera.position.x) * camFollow;
            camera.position.z += (idealCamZ - camera.position.z) * camFollow;
            camera.position.y += (idealCamY - camera.position.y) * camFollow;
            camera.fov += (targetFov - camera.fov) * fovFollow;
            camera.updateProjectionMatrix();
            camera.lookAt(carGroup.position.x + targetLookAhead, carGroup.position.y, carGroup.position.z);

            mainDirLight.position.x = carGroup.position.x + 50;
        }

        // Keep sun mesh relative so it smoothly tracks the car
        sunMesh.position.x = carGroup.position.x + 80;
    }

    composer.render();
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
