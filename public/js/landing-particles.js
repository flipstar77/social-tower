/**
 * Landing Page Particle Effect - The Tower Defense Style
 *
 * Easter egg: Tower defense gameplay on the landing page!
 * - Hollow square enemies (red, green, yellow) attack from edges
 * - Logo (the tower) shoots pixel projectiles to defend
 * - Simple retro graphics matching The Tower's style 🎮
 */

class TowerDefenseEffect {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemySpawnRate = 60; // frames between spawns
        this.frameCount = 0;
        this.colors = ['#FF0000', '#00FF00', '#FFFF00'];
        this.logo = null;
        this.logoRect = null;
        this.isActive = false;
        this.animationId = null;
    }

    init() {
        console.log('🎨 Initializing Tower Defense effect...');

        this.logo = document.querySelector('.hero-logo');
        if (!this.logo) {
            console.warn('⚠️ Logo element not found (.hero-logo), effect disabled');
            return;
        }

        console.log('✅ Logo found, creating canvas...');

        this.createCanvas();
        this.addEventListeners();
        this.animate();

        console.log('✅ Tower Defense animation started!');
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '2';

        const heroFeatures = document.querySelector('.hero-features');
        if (heroFeatures) {
            heroFeatures.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const heroFeatures = document.querySelector('.hero-features');
        if (!heroFeatures) return;

        const rect = heroFeatures.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

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
            radius: logoRect.width / 2
        };
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;

        switch(side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -20;
                break;
            case 1: // right
                x = this.canvas.width + 20;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 20;
                break;
            case 3: // left
                x = -20;
                y = Math.random() * this.canvas.height;
                break;
        }

        this.enemies.push({
            x,
            y,
            size: 10,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            speed: 1.5,
            health: 3
        });
    }

    shootProjectile(targetEnemy) {
        if (!this.logoRect || !targetEnemy) return;

        // Calculate direction to enemy
        const dx = targetEnemy.x - this.logoRect.x;
        const dy = targetEnemy.y - this.logoRect.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.projectiles.push({
            x: this.logoRect.x,
            y: this.logoRect.y,
            vx: (dx / distance) * 4,
            vy: (dy / distance) * 4,
            size: 3
        });
    }

    addEventListeners() {
        this.logo.addEventListener('mouseenter', () => {
            this.isActive = true;
            console.log('🎯 Tower defense activated!');
        });

        this.logo.addEventListener('mouseleave', () => {
            this.isActive = false;
            // Clear enemies when deactivated
            this.enemies = [];
            this.projectiles = [];
            console.log('💤 Tower defense deactivated');
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateLogoPosition();

        if (!this.logoRect) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        if (this.isActive) {
            this.frameCount++;

            // Spawn enemies
            if (this.frameCount % this.enemySpawnRate === 0) {
                this.spawnEnemy();
            }

            // Shoot at nearest enemy periodically
            if (this.frameCount % 20 === 0 && this.enemies.length > 0) {
                // Find closest enemy
                let closest = null;
                let minDist = Infinity;

                this.enemies.forEach(enemy => {
                    const dx = enemy.x - this.logoRect.x;
                    const dy = enemy.y - this.logoRect.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = enemy;
                    }
                });

                if (closest) {
                    this.shootProjectile(closest);
                }
            }

            // Update enemies
            this.enemies = this.enemies.filter(enemy => {
                // Move towards logo (tower)
                const dx = this.logoRect.x - enemy.x;
                const dy = this.logoRect.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;

                // Remove if reached logo or health depleted
                return distance > this.logoRect.radius && enemy.health > 0;
            });

            // Update projectiles
            this.projectiles = this.projectiles.filter(proj => {
                proj.x += proj.vx;
                proj.y += proj.vy;

                // Check collision with enemies
                let hit = false;
                this.enemies.forEach(enemy => {
                    const dx = enemy.x - proj.x;
                    const dy = enemy.y - proj.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < enemy.size) {
                        enemy.health--;
                        hit = true;
                    }
                });

                // Remove if hit or off screen
                const onScreen = proj.x > 0 && proj.x < this.canvas.width &&
                                proj.y > 0 && proj.y < this.canvas.height;
                return !hit && onScreen;
            });

            // Draw enemies (hollow squares)
            this.enemies.forEach(enemy => {
                this.ctx.strokeStyle = enemy.color;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    enemy.x - enemy.size / 2,
                    enemy.y - enemy.size / 2,
                    enemy.size,
                    enemy.size
                );
            });

            // Draw projectiles (pixels)
            this.ctx.fillStyle = '#FFFFFF';
            this.projectiles.forEach(proj => {
                this.ctx.fillRect(proj.x - proj.size / 2, proj.y - proj.size / 2, proj.size, proj.size);
            });
        }

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
    console.log('🔮 Tower Defense script loaded');

    const landingPage = document.getElementById('landing-page');
    console.log('Landing page element:', landingPage);
    console.log('Landing page display:', landingPage?.style.display);

    if (landingPage && landingPage.style.display !== 'none') {
        console.log('✅ Landing page is visible, initializing tower defense...');
        const towerDefense = new TowerDefenseEffect();
        towerDefense.init();

        window.towerDefenseEffect = towerDefense;
    } else {
        console.log('⚠️ Landing page not visible, skipping initialization');
    }
});

// Cleanup when user logs in
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList && mutation.target.classList.contains('landing-page')) {
                if (mutation.target.style.display === 'none') {
                    if (window.towerDefenseEffect) {
                        window.towerDefenseEffect.destroy();
                        window.towerDefenseEffect = null;
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
