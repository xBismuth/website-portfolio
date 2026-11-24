// DarkVeil Background Effect - Optimized Version with Flowing Light Design
class DarkVeil {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            speed: options.speed || 0.3,
            opacity: options.opacity || 0.15,
            intensity: options.intensity || 0.5,
            ...options
        };
        
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.time = 0;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.targetFPS = 30; // Reduce to 30fps for better performance
        this.frameInterval = 1000 / this.targetFPS;
        
        // Debounce resize
        this.resizeTimeout = null;
        
        this.init();
    }
    
    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'darkveil-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
            opacity: ${this.options.opacity};
            will-change: transform;
        `;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'low'; // Better performance
        
        this.container.style.position = 'relative';
        this.container.insertBefore(this.canvas, this.container.firstChild);
        
        this.resize();
        this.animate();
        
        // Debounced resize handler
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.resize(), 150);
        });
    }
    
    resize() {
        const dpr = Math.min(window.devicePixelRatio, 1.5); // Limit DPR for performance
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.width = width;
        this.height = height;
    }
    
    // Optimized noise function using simpler math
    fastNoise(x, y, time) {
        return (Math.sin(x * 0.02 + time) + Math.cos(y * 0.015 + time * 0.8)) * 0.5 + 0.5;
    }
    
    // Create flowing light streak effect
    drawFlowingStreak(time, offsetX, offsetY, angle, length, intensity) {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        const centerX = width * offsetX;
        const centerY = height * offsetY;
        const waveOffset = Math.sin(time * 0.4) * 40;
        const waveSpeed = time * 0.3;
        
        // Create flowing path
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        
        const points = [];
        const segments = 40;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pos = (t - 0.5) * length;
            const wave = Math.sin(pos * 0.02 + waveSpeed) * waveOffset;
            const widthVariation = 50 + Math.sin(pos * 0.05 + time) * 30;
            
            const x = centerX + Math.cos(angle) * pos + Math.sin(angle) * wave;
            const y = centerY + Math.sin(angle) * pos - Math.cos(angle) * wave;
            
            points.push({ x, y, width: widthVariation });
        }
        
        // Draw the flowing streak with gradient
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const t = i / (points.length - 1);
            
            // Create gradient for this segment
            const gradient = ctx.createLinearGradient(
                p1.x - Math.sin(angle) * p1.width,
                p1.y + Math.cos(angle) * p1.width,
                p1.x + Math.sin(angle) * p1.width,
                p1.y - Math.cos(angle) * p1.width
            );
            
            // Fade at edges, bright in center
            const centerAlpha = intensity * (0.12 - Math.abs(t - 0.5) * 0.08);
            const edgeAlpha = 0;
            
            gradient.addColorStop(0, `rgba(212, 212, 212, ${edgeAlpha})`);
            gradient.addColorStop(0.3, `rgba(212, 212, 212, ${centerAlpha * 0.5})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${centerAlpha})`);
            gradient.addColorStop(0.7, `rgba(212, 212, 212, ${centerAlpha * 0.5})`);
            gradient.addColorStop(1, `rgba(179, 179, 179, ${edgeAlpha})`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(
                p1.x - Math.sin(angle) * p1.width,
                p1.y + Math.cos(angle) * p1.width
            );
            ctx.lineTo(
                p1.x + Math.sin(angle) * p1.width,
                p1.y - Math.cos(angle) * p1.width
            );
            ctx.lineTo(
                p2.x + Math.sin(angle) * p2.width,
                p2.y - Math.cos(angle) * p2.width
            );
            ctx.lineTo(
                p2.x - Math.sin(angle) * p2.width,
                p2.y + Math.cos(angle) * p2.width
            );
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Draw soft glow in corners
    drawCornerGlow(time, cornerX, cornerY, intensity) {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        const gradient = ctx.createRadialGradient(
            width * cornerX,
            height * cornerY,
            0,
            width * cornerX,
            height * cornerY,
            Math.min(width, height) * 0.4
        );
        
        const pulse = 0.5 + Math.sin(time * 0.3) * 0.3;
        gradient.addColorStop(0, `rgba(212, 212, 212, ${intensity * 0.1 * pulse})`);
        gradient.addColorStop(0.5, `rgba(179, 179, 179, ${intensity * 0.05 * pulse})`);
        gradient.addColorStop(1, 'rgba(43, 43, 43, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    // Draw dark shadow areas for depth
    drawDarkShadow(time, offsetX, offsetY, size, intensity) {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        const gradient = ctx.createRadialGradient(
            width * offsetX,
            height * offsetY,
            0,
            width * offsetX,
            height * offsetY,
            Math.min(width, height) * size
        );
        
        const pulse = 0.7 + Math.sin(time * 0.2) * 0.2;
        // Use darker shades from palette
        gradient.addColorStop(0, `rgba(27, 27, 27, ${intensity * 0.4 * pulse})`);
        gradient.addColorStop(0.3, `rgba(35, 35, 35, ${intensity * 0.25 * pulse})`);
        gradient.addColorStop(0.6, `rgba(43, 43, 43, ${intensity * 0.15 * pulse})`);
        gradient.addColorStop(1, 'rgba(43, 43, 43, 0)');
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    // Draw dark vignette effect
    drawVignette(intensity) {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        const gradient = ctx.createRadialGradient(
            width * 0.5,
            height * 0.5,
            0,
            width * 0.5,
            height * 0.5,
            Math.max(width, height) * 0.8
        );
        
        // Dark edges, transparent center
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, `rgba(20, 20, 20, ${intensity * 0.15})`);
        gradient.addColorStop(0.8, `rgba(27, 27, 27, ${intensity * 0.25})`);
        gradient.addColorStop(1, `rgba(15, 15, 15, ${intensity * 0.35})`);
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    // Draw dark bottom half overlay
    drawDarkBottom(time, intensity) {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        const gradient = ctx.createLinearGradient(
            0, height * 0.4,
            0, height
        );
        
        const pulse = 0.8 + Math.sin(time * 0.15) * 0.15;
        gradient.addColorStop(0, 'rgba(43, 43, 43, 0)');
        gradient.addColorStop(0.3, `rgba(35, 35, 35, ${intensity * 0.2 * pulse})`);
        gradient.addColorStop(0.6, `rgba(27, 27, 27, ${intensity * 0.35 * pulse})`);
        gradient.addColorStop(1, `rgba(20, 20, 20, ${intensity * 0.45 * pulse})`);
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.4, width, height * 0.6);
        ctx.restore();
    }
    
    // Draw dark regions between light streaks
    drawDarkRegions(time, intensity) {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = intensity * 0.3;
        
        // Dark area in upper left
        const darkGradient1 = ctx.createRadialGradient(
            width * 0.15,
            height * 0.2,
            0,
            width * 0.15,
            height * 0.2,
            width * 0.3
        );
        darkGradient1.addColorStop(0, `rgba(30, 30, 30, 0.6)`);
        darkGradient1.addColorStop(1, 'rgba(43, 43, 43, 0)');
        
        // Dark area in upper right
        const darkGradient2 = ctx.createRadialGradient(
            width * 0.85,
            height * 0.25,
            0,
            width * 0.85,
            height * 0.25,
            width * 0.25
        );
        darkGradient2.addColorStop(0, `rgba(25, 25, 25, 0.5)`);
        darkGradient2.addColorStop(1, 'rgba(43, 43, 43, 0)');
        
        // Dark area in center-top
        const darkGradient3 = ctx.createRadialGradient(
            width * 0.5,
            height * 0.15,
            0,
            width * 0.5,
            height * 0.15,
            width * 0.2
        );
        darkGradient3.addColorStop(0, `rgba(32, 32, 32, 0.4)`);
        darkGradient3.addColorStop(1, 'rgba(43, 43, 43, 0)');
        
        ctx.fillStyle = darkGradient1;
        ctx.fillRect(0, 0, width, height * 0.5);
        
        ctx.fillStyle = darkGradient2;
        ctx.fillRect(0, 0, width, height * 0.5);
        
        ctx.fillStyle = darkGradient3;
        ctx.fillRect(0, 0, width, height * 0.5);
        
        ctx.restore();
    }
    
    draw() {
        const width = this.width;
        const height = this.height;
        const time = this.time * this.options.speed;
        const intensity = this.options.intensity;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw dark bottom half first (base layer)
        this.drawDarkBottom(time, intensity);
        
        // Draw dark shadow areas for depth
        this.drawDarkShadow(time, 0.1, 0.3, 0.3, intensity * 0.8);
        this.drawDarkShadow(time, 0.9, 0.35, 0.25, intensity * 0.7);
        this.drawDarkShadow(time, 0.5, 0.5, 0.4, intensity * 0.6);
        
        // Draw dark regions between light areas
        this.drawDarkRegions(time, intensity);
        
        // Draw corner glows (top areas) - light on dark
        this.drawCornerGlow(time, 0.2, 0.1, intensity);
        this.drawCornerGlow(time, 0.8, 0.15, intensity * 0.7);
        
        // Draw main flowing streak (top center to right)
        const mainAngle = Math.PI * 0.15 + Math.sin(time * 0.2) * 0.1;
        this.drawFlowingStreak(time, 0.5, 0.2, mainAngle, width * 0.4, intensity);
        
        // Draw secondary flowing streaks
        const secondaryAngle = Math.PI * 0.3 + Math.cos(time * 0.25) * 0.15;
        this.drawFlowingStreak(time, 0.3, 0.25, secondaryAngle, width * 0.3, intensity * 0.6);
        
        const tertiaryAngle = Math.PI * 0.1 + Math.sin(time * 0.3) * 0.1;
        this.drawFlowingStreak(time, 0.7, 0.3, tertiaryAngle, width * 0.25, intensity * 0.5);
        
        // Draw vignette for overall depth
        this.drawVignette(intensity);
        
        // Add subtle texture overlay (optimized - only top half where light is)
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.globalAlpha = 0.02;
        
        // Use a simpler texture pattern - only in upper half
        const patternSize = 300; // Larger pattern = fewer operations
        const topHalf = height * 0.5;
        
        for (let y = 0; y < topHalf; y += patternSize) {
            for (let x = 0; x < width; x += patternSize) {
                const noise = this.fastNoise(x, y, time);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${noise})`;
                this.ctx.fillRect(x, y, patternSize, patternSize);
            }
        }
        this.ctx.restore();
    }
    
    animate(currentTime = 0) {
        // Throttle to target FPS
        const elapsed = currentTime - this.lastFrameTime;
        
        if (elapsed >= this.frameInterval) {
            this.time += elapsed / 1000; // Convert to seconds
            this.lastFrameTime = currentTime - (elapsed % this.frameInterval);
            
            this.draw();
            this.frameCount++;
        }
        
        this.animationFrame = requestAnimationFrame((time) => this.animate(time));
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
    }
}

// Initialize DarkVeil on page load
if (typeof window !== 'undefined') {
    window.DarkVeil = DarkVeil;
}
