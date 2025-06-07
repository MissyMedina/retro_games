// Fractal-based visual effects system
export class FractalRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.starfield = [];
        this.explosionAuras = [];
    }

    // Initialize fractal starfield
    initStarfield() {
        this.starfield = [];
        const numStars = 120;
        
        for (let i = 0; i < numStars; i++) {
            this.starfield.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                r: Math.random() * 1.2 + 0.3,
                speed: Math.random() * 0.7 + 0.2,
                hue: Math.random() * 360
            });
        }
    }

    // Draw fractal starfield
    drawStarfield() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let star of this.starfield) {
            // Create fractal-like glow effect
            const gradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.r * 3
            );
            
            gradient.addColorStop(0, `hsla(${star.hue}, 100%, 100%, 0.8)`);
            gradient.addColorStop(0.5, `hsla(${star.hue}, 100%, 80%, 0.3)`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Update star position
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.x = Math.random() * this.canvas.width;
                star.y = 0;
                star.hue = Math.random() * 360;
            }
        }
    }

    // Create explosion aura effect
    createExplosionAura(x, y, type) {
        const aura = {
            x, y,
            radius: 0,
            maxRadius: type === 'bonus' ? 100 : 50,
            hue: type === 'bonus' ? 60 : 0, // Yellow for bonus, red for normal
            alpha: 1
        };
        this.explosionAuras.push(aura);
    }

    // Draw and update explosion auras
    drawExplosionAuras() {
        for (let i = this.explosionAuras.length - 1; i >= 0; i--) {
            const aura = this.explosionAuras[i];
            
            // Create fractal-like explosion pattern
            const gradient = this.ctx.createRadialGradient(
                aura.x, aura.y, 0,
                aura.x, aura.y, aura.radius
            );
            
            gradient.addColorStop(0, `hsla(${aura.hue}, 100%, 50%, ${aura.alpha})`);
            gradient.addColorStop(0.5, `hsla(${aura.hue}, 100%, 30%, ${aura.alpha * 0.5})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(aura.x, aura.y, aura.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Update aura
            aura.radius += 5;
            aura.alpha -= 0.02;
            
            // Remove faded auras
            if (aura.alpha <= 0) {
                this.explosionAuras.splice(i, 1);
            }
        }
    }
} 