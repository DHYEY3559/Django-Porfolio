/**
 * Secondary particle network — a subtle canvas overlay for section backgrounds.
 * Draws connected dots that respond to scroll position.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only create particle network on larger screens
    if (window.innerWidth < 768) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'particle-network';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
        opacity: 0.3;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particlesArray = [];
    const maxParticles = 60;
    const connectionDistance = 120;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = 1 + Math.random() * 1.5;
            this.opacity = 0.3 + Math.random() * 0.4;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 245, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    function init() {
        particlesArray = [];
        for (let i = 0; i < maxParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    function drawConnections() {
        for (let i = 0; i < particlesArray.length; i++) {
            for (let j = i + 1; j < particlesArray.length; j++) {
                const dx = particlesArray[i].x - particlesArray[j].x;
                const dy = particlesArray[i].y - particlesArray[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    const opacity = (1 - dist / connectionDistance) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.strokeStyle = `rgba(0, 245, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        particlesArray.forEach(p => {
            p.update();
            p.draw();
        });

        drawConnections();
    }

    resize();
    init();
    animate();

    window.addEventListener('resize', () => {
        resize();
        init();
    });
});
