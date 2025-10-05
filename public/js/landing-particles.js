/**
 * Landing Page Particle Effect
 * Creates colorful squares that swarm around the logo
 *
 * Easter egg: These are the square enemies from The Tower game!
 * - Squares in red, green, and yellow
 * - They "attack" the logo when you hover over it
 * - A fun nod to The Tower community! 🎮
 */

class LogoParticleEffect {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.particleCount = 30;
        this.colors = ['#FF0000', '#00FF00', '#FFFF00']; // Enemy colors from The Tower
        this.logo = null;
        this.logoRect = null;
        this.isHovering = false;
        this.animationId = null;
    }

    init() {
        console.log('🎨 Initializing particle effect...');

        // Find the logo element
        this.logo = document.querySelector('.hero-logo');
        if (!this.logo) {
            console.warn('⚠️ Logo element not found (.hero-logo), particles disabled');
            return;
        }

        console.log('✅ Logo found, creating canvas...');

        // Create canvas
        this.createCanvas();

        // Create particles
        this.createParticles();
        console.log(`✅ Created ${this.particles.length} particles`);

        // Add hover listeners
        this.addEventListeners();

        // Start animation
        this.animate();
        console.log('✅ Particle animation started!');
    }

    createCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '2';

        // Add to hero-features
        const heroFeatures = document.querySelector('.hero-features');
        if (heroFeatures) {
            heroFeatures.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const heroFeatures = document.querySelector('.hero-features');
        if (!heroFeatures) return;

        const rect = heroFeatures.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Update logo position
        this.updateLogoPosition();
    }

    updateLogoPosition() {
        if (!this.logo) return;

        const heroFeatures = document.querySelector('.hero-features');
        if (!heroFeatures) return;

        const heroRect = heroFeatures.getBoundingClientRect();
        const logoRect = this.logo.getBoundingClientRect();

        this.logoRect = {
            x: logoRect.left - heroRect.left + logoRect.width / 2,
            y: logoRect.top - heroRect.top + logoRect.height / 2,
            width: logoRect.width,
            height: logoRect.height
        };
    }

    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 8 + 4,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 5,
                opacity: Math.random() * 0.3 + 0.2,
                targetOpacity: 0.2,
                angle: Math.random() * Math.PI * 2,
                distance: Math.random() * 200 + 50
            });
        }
    }

    addEventListeners() {
        this.logo.addEventListener('mouseenter', () => {
            this.isHovering = true;
            this.particles.forEach(p => {
                p.targetOpacity = 1;
            });
        });

        this.logo.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.particles.forEach(p => {
                p.targetOpacity = 0.2;
            });
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateLogoPosition();

        if (!this.logoRect) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        // Update and draw particles
        this.particles.forEach(particle => {
            if (this.isHovering) {
                // Swarm towards logo
                const dx = this.logoRect.x - particle.x;
                const dy = this.logoRect.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Orbit around logo
                particle.angle += 0.02;
                const orbitRadius = 80 + particle.distance * 0.3;
                const targetX = this.logoRect.x + Math.cos(particle.angle) * orbitRadius;
                const targetY = this.logoRect.y + Math.sin(particle.angle) * orbitRadius;

                particle.vx += (targetX - particle.x) * 0.01;
                particle.vy += (targetY - particle.y) * 0.01;
            } else {
                // Drift randomly
                particle.vx += (Math.random() - 0.5) * 0.5;
                particle.vy += (Math.random() - 0.5) * 0.5;
            }

            // Apply velocity damping
            particle.vx *= 0.95;
            particle.vy *= 0.95;

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Update rotation
            particle.rotation += particle.rotationSpeed;

            // Smooth opacity transition
            particle.opacity += (particle.targetOpacity - particle.opacity) * 0.1;

            // Wrap around edges
            if (particle.x < -20) particle.x = this.canvas.width + 20;
            if (particle.x > this.canvas.width + 20) particle.x = -20;
            if (particle.y < -20) particle.y = this.canvas.height + 20;
            if (particle.y > this.canvas.height + 20) particle.y = -20;

            // Draw particle (square enemy from The Tower!)
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate((particle.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            this.ctx.restore();
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔮 Landing particles script loaded');

    // Only initialize on landing page
    const landingPage = document.getElementById('landing-page');
    console.log('Landing page element:', landingPage);
    console.log('Landing page display:', landingPage?.style.display);

    if (landingPage && landingPage.style.display !== 'none') {
        console.log('✅ Landing page is visible, initializing particles...');
        const particleEffect = new LogoParticleEffect();
        particleEffect.init();

        // Store globally so it can be cleaned up
        window.logoParticleEffect = particleEffect;
    } else {
        console.log('⚠️ Landing page not visible, skipping particle initialization');
    }
});

// Cleanup when user logs in
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList && mutation.target.classList.contains('landing-page')) {
                if (mutation.target.style.display === 'none') {
                    if (window.logoParticleEffect) {
                        window.logoParticleEffect.destroy();
                        window.logoParticleEffect = null;
                    }
                }
            }
        });
    });

    const landingPage = document.getElementById('landing-page');
    if (landingPage) {
        observer.observe(landingPage, { attributes: true, attributeFilter: ['style'] });
    }
});
