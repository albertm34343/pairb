import * as THREE from 'three';

const canvas = document.getElementById('gas-webgl');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const GAS_COUNT = 1000;
const PINK_COLOR = new THREE.Color(0xff5da2);
const BLUE_COLOR = new THREE.Color(0x4d8bff);
const MIX_COLOR = new THREE.Color(0xb182ff);

const positions = new Float32Array(GAS_COUNT * 3);
const colors = new Float32Array(GAS_COUNT * 3);
const sizes = new Float32Array(GAS_COUNT);
const velocities = new Float32Array(GAS_COUNT * 3);

const halfCount = GAS_COUNT / 2;

for (let i = 0; i < GAS_COUNT; i++) {
    const isPink = i < halfCount;
    const index = i * 3;
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.15 + Math.random() * 0.4;
    
    positions[index] = Math.cos(angle) * radius;
    positions[index + 1] = Math.sin(angle) * radius;
    positions[index + 2] = 0;
    
    if (isPink) {
        colors[index] = PINK_COLOR.r;
        colors[index + 1] = PINK_COLOR.g;
        colors[index + 2] = PINK_COLOR.b;
    } else {
        colors[index] = BLUE_COLOR.r;
        colors[index + 1] = BLUE_COLOR.g;
        colors[index + 2] = BLUE_COLOR.b;
    }
    
    sizes[i] = 0.15 + Math.random() * 0.25;
    
    velocities[index] = (Math.random() - 0.5) * 0.05;
    velocities[index + 1] = (Math.random() - 0.5) * 0.05;
    velocities[index + 2] = 0;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const vertexShader = `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (250.0 / -mvPosition.z) * 2.5;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying vec3 vColor;
    void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;
        float alpha = (1.0 - r) * 0.8;
        alpha = pow(alpha, 1.8);
        gl_FragColor = vec4(vColor, alpha);
    }
`;

const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.MultiplyBlending,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

let startTime = performance.now();

function updateGas(timestamp) {
    const elapsed = timestamp - startTime;
    
    const posAttr = geometry.attributes.position;
    const colAttr = geometry.attributes.color;
    const posArray = posAttr.array;
    const colArray = colAttr.array;
    
    for (let i = 0; i < GAS_COUNT; i++) {
        const idx = i * 3;
        const isPink = i < halfCount;
        
        velocities[idx] += (Math.random() - 0.5) * 0.02;
        velocities[idx + 1] += (Math.random() - 0.5) * 0.02;
        
        const speed = Math.sqrt(velocities[idx]*velocities[idx] + velocities[idx+1]*velocities[idx+1]);
        if (speed > 0.15) {
            velocities[idx] = (velocities[idx] / speed) * 0.15;
            velocities[idx + 1] = (velocities[idx + 1] / speed) * 0.15;
        }
        
        const centerX = 0.0;
        const centerY = 0.0;
        const dx = centerX - posArray[idx];
        const dy = centerY - posArray[idx + 1];
        velocities[idx] += dx * 0.003;
        velocities[idx + 1] += dy * 0.003;
        
        const mixFactor = 0.5 + Math.sin(elapsed * 0.0003) * 0.2;
        if (isPink) {
            const targetColor = MIX_COLOR.clone().lerp(PINK_COLOR, 0.6);
            colArray[idx] = PINK_COLOR.r + (targetColor.r - PINK_COLOR.r) * mixFactor;
            colArray[idx + 1] = PINK_COLOR.g + (targetColor.g - PINK_COLOR.g) * mixFactor;
            colArray[idx + 2] = PINK_COLOR.b + (targetColor.b - PINK_COLOR.b) * mixFactor;
        } else {
            const targetColor = MIX_COLOR.clone().lerp(BLUE_COLOR, 0.4);
            colArray[idx] = BLUE_COLOR.r + (targetColor.r - BLUE_COLOR.r) * mixFactor;
            colArray[idx + 1] = BLUE_COLOR.g + (targetColor.g - BLUE_COLOR.g) * mixFactor;
            colArray[idx + 2] = BLUE_COLOR.b + (targetColor.b - BLUE_COLOR.b) * mixFactor;
        }
        
        posArray[idx] += velocities[idx] * 0.02;
        posArray[idx + 1] += velocities[idx + 1] * 0.02;
        
        if (posArray[idx] < -0.7) posArray[idx] = -0.7;
        if (posArray[idx] > 0.7) posArray[idx] = 0.7;
        if (posArray[idx + 1] < -0.7) posArray[idx + 1] = -0.7;
        if (posArray[idx + 1] > 0.7) posArray[idx + 1] = 0.7;
    }
    
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
}

function animate(timestamp) {
    updateGas(timestamp);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
});