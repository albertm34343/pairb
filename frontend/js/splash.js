const canvas = document.getElementById('liquidCanvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

class Particle {
    constructor(color, side) {
        this.reset(color, side);
    }

    reset(color, side) {
        this.color = color;
        this.side = side;
        this.x = side === 'left' ? -Math.random() * 100 : width + Math.random() * 100;
        this.y = Math.random() * height;
        this.size = Math.random() * 120 + 60;
        this.speedX = side === 'left' ? Math.random() * 2 + 1 : -(Math.random() * 2 + 1);
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = 0;
        this.targetOpacity = Math.random() * 0.4 + 0.3;
        this.blur = Math.random() * 40 + 20;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
        this.wobbleAmount = Math.random() * 30 + 10;
        this.centerX = width / 2;
    }

    update() {
        this.wobble += this.wobbleSpeed;
        this.x += this.speedX;
        this.y += this.speedY + Math.sin(this.wobble) * this.wobbleAmount * 0.1;

        const distToCenter = Math.abs(this.x - this.centerX);
        if (distToCenter < 200) {
            this.speedX *= 0.98;
        }

        if (distToCenter < 150) {
            this.opacity *= 0.97;
            this.size *= 0.995;
        } else {
            if (this.opacity < this.targetOpacity) {
                this.opacity += 0.01;
            }
        }

        if (this.x > width + 200 || this.x < -200 || this.opacity < 0.01) {
            this.reset(this.color, this.side);
        }
    }

    draw() {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color.replace('1)', '0.6)'));
        gradient.addColorStop(1, 'transparent');

        ctx.globalAlpha = this.opacity;
        ctx.filter = `blur(${this.blur}px)`;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
    }
}

const particles = [];
const blueColor = 'rgba(100, 170, 255, 1)';
const pinkColor = 'rgba(255, 130, 180, 1)';
const purpleColor = 'rgba(180, 140, 255, 1)';

for (let i = 0; i < 25; i++) {
    const p = new Particle(blueColor, 'left');
    p.opacity = Math.random() * 0.4 + 0.2;
    p.x = -Math.random() * 200;
    particles.push(p);
}

for (let i = 0; i < 25; i++) {
    const p = new Particle(pinkColor, 'right');
    p.opacity = Math.random() * 0.4 + 0.2;
    p.x = width + Math.random() * 200;
    particles.push(p);
}

for (let i = 0; i < 15; i++) {
    const p = new Particle(purpleColor, 'center');
    p.x = width / 2 + (Math.random() - 0.5) * 300;
    p.opacity = Math.random() * 0.3 + 0.1;
    p.speedX = (Math.random() - 0.5) * 0.3;
    p.speedY = (Math.random() - 0.5) * 0.5;
    p.targetOpacity = Math.random() * 0.3 + 0.1;
    p.size = Math.random() * 80 + 40;
    particles.push(p);
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    const centerGlow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 300);
    centerGlow.addColorStop(0, 'rgba(200, 180, 255, 0.15)');
    centerGlow.addColorStop(0.5, 'rgba(180, 200, 255, 0.1)');
    centerGlow.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.5;
    ctx.filter = 'blur(20px)';
    ctx.fillStyle = centerGlow;
    ctx.fillRect(width / 2 - 300, height / 2 - 300, 600, 600);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.transition = 'opacity 0.8s ease';
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 800);
        }
    }, 3000);
});