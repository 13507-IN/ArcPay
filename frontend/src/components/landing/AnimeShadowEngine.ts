/**
 * Anime & Shadow Fight Aesthetic Japanese Canvas Engine
 *
 * Combines:
 * 1. Cinematic Anime / Shadow Fight Twilight Sky (Deep Indigo, Crimson Magenta, Sunset Amber)
 * 2. Majestic Celestial Sun/Moon with Atmospheric Halos
 * 3. Layered Shadow Fight Silhouettes: Mount Fuji, Misty Valleys, Pagoda, Torii Gate & Sakura Branches
 * 4. 3D Tumbling Falling Sakura (Cherry Blossom) Petals with Interactive Mouse Wind
 * 5. Authentic Shadow Fight Procedural Film Grain & Floating Embers
 * 6. Ambient Japanese Pentatonic Koto / Wind Chime Soundscape (Web Audio API)
 */

export interface AnimeEngineOptions {
  enableGrain?: boolean;
  enablePetals?: boolean;
}

interface Petal {
  x: number;
  y: number;
  z: number; // Depth scale (0.35 to 1.25)
  vx: number;
  vy: number;
  size: number;
  angleX: number;
  angleY: number;
  angleZ: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  colorIndex: number;
  petalType: number;
}

interface Ember {
  x: number;
  y: number;
  radius: number;
  vy: number;
  vx: number;
  alpha: number;
  pulseSpeed: number;
}

interface SlashSpark {
  x: number;
  y: number;
  angle: number;
  length: number;
  life: number;
  maxLife: number;
}

export class AnimeShadowEngine {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private width = 0;
  private height = 0;
  private dpr = 1;

  private animFrameId = 0;
  private lastTime = 0;
  private destroyed = false;
  private isPaused = false;

  // Layer Offscreen Caches for Ultra-Fast 60+ FPS Blitting
  private bgLayer: HTMLCanvasElement | null = null;
  private silhouetteLayer: HTMLCanvasElement | null = null;
  private grainPattern: HTMLCanvasElement | null = null;

  // Particle Systems
  private petals: Petal[] = [];
  private embers: Ember[] = [];
  private slashes: SlashSpark[] = [];
  private readonly petalCount = 135;
  private readonly emberCount = 40;

  // Interactive Wind & Mouse State
  private mouse = { x: -9999, y: -9999, lastX: 0, lastY: 0, vx: 0, vy: 0, active: false };
  private windBurst = 0;
  private baseWind = 0.8;

  // Toggles
  public grainEnabled = true;
  public petalsEnabled = true;

  private removeListeners: Array<() => void> = [];

  constructor(container: HTMLElement, options?: AnimeEngineOptions) {
    this.container = container;
    this.grainEnabled = options?.enableGrain ?? true;
    this.petalsEnabled = options?.enablePetals ?? true;

    this.canvas = document.createElement("canvas");
    this.canvas.className = "w-full h-full block";
    this.ctx = this.canvas.getContext("2d", { alpha: false })!;
    this.container.appendChild(this.canvas);

    this.initSize();
    this.generateGrainPattern();
    this.renderStaticLayers();
    this.initPetals();
    this.initEmbers();
    this.initEvents();

    this.lastTime = performance.now() * 0.001;
    this.loop();
  }

  private initSize() {
    this.dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    this.width = this.container.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1280);
    this.height = this.container.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 800);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  // ---------------------------------------------------------------------------
  // Shadow Fight Procedural Film Grain Generator
  // ---------------------------------------------------------------------------
  private generateGrainPattern() {
    const size = 256;
    const gCanvas = document.createElement("canvas");
    gCanvas.width = size;
    gCanvas.height = size;
    const gCtx = gCanvas.getContext("2d")!;
    const imgData = gCtx.createImageData(size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Gritty monochrome film noise with high contrast
      const v = Math.random() < 0.5 ? Math.random() * 45 : 210 + Math.random() * 45;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = Math.floor(18 + Math.random() * 26); // Subtle opacity
    }
    gCtx.putImageData(imgData, 0, 0);
    this.grainPattern = gCanvas;
  }

  // ---------------------------------------------------------------------------
  // Pre-render Static Scenery (Anime Twilight Sky + Sun + Silhouette Artwork)
  // ---------------------------------------------------------------------------
  private renderStaticLayers() {
    const w = this.width;
    const h = this.height;

    // --- 1. Twilight Sky & Glowing Celestial Disc ---
    this.bgLayer = document.createElement("canvas");
    this.bgLayer.width = Math.floor(w * this.dpr);
    this.bgLayer.height = Math.floor(h * this.dpr);
    const bCtx = this.bgLayer.getContext("2d")!;
    bCtx.scale(this.dpr, this.dpr);

    // Cinematic Anime / Shadow Fight Twilight Gradient
    const skyGrad = bCtx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, "#080614"); // Zenith: Deep night cosmos
    skyGrad.addColorStop(0.22, "#190d2e"); // Deep twilight violet
    skyGrad.addColorStop(0.44, "#3f103b"); // Rich Japanese plum
    skyGrad.addColorStop(0.66, "#781538"); // Crimson-rose dusk
    skyGrad.addColorStop(0.82, "#b92b27"); // Sunset scarlet
    skyGrad.addColorStop(0.93, "#e65c00"); // Radiant amber glow
    skyGrad.addColorStop(1.0, "#fbc02d"); // Horizon gold
    bCtx.fillStyle = skyGrad;
    bCtx.fillRect(0, 0, w, h);

    // Glowing Sun/Moon Disc (Shadow Fight style)
    const sunX = w * 0.76;
    const sunY = h * 0.52;
    const sunRadius = Math.min(w, h) * 0.17;

    // Celestial Atmospheric Glow Halos
    const sunHalo = bCtx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 2.8);
    sunHalo.addColorStop(0.0, "rgba(255, 240, 200, 0.45)");
    sunHalo.addColorStop(0.35, "rgba(244, 63, 94, 0.22)");
    sunHalo.addColorStop(0.7, "rgba(168, 85, 247, 0.08)");
    sunHalo.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    bCtx.fillStyle = sunHalo;
    bCtx.beginPath();
    bCtx.arc(sunX, sunY, sunRadius * 2.8, 0, Math.PI * 2);
    bCtx.fill();

    // Solid Sun/Moon Orb
    const sunDisc = bCtx.createRadialGradient(sunX, sunY, sunRadius * 0.1, sunX, sunY, sunRadius);
    sunDisc.addColorStop(0.0, "#fffbeb"); // Radiant ivory center
    sunDisc.addColorStop(0.4, "#fed7aa"); // Warm peach
    sunDisc.addColorStop(0.85, "#fb7185"); // Crimson-pink rim
    sunDisc.addColorStop(1.0, "rgba(225, 29, 72, 0.85)");
    bCtx.fillStyle = sunDisc;
    bCtx.beginPath();
    bCtx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    bCtx.fill();

    // Soft Atmospheric Horizon Mist
    const horizonMist = bCtx.createLinearGradient(0, h * 0.65, 0, h);
    horizonMist.addColorStop(0.0, "rgba(251, 146, 60, 0.0)");
    horizonMist.addColorStop(0.5, "rgba(251, 113, 133, 0.18)");
    horizonMist.addColorStop(1.0, "rgba(180, 83, 9, 0.35)");
    bCtx.fillStyle = horizonMist;
    bCtx.fillRect(0, h * 0.65, w, h * 0.35);

    // --- 2. Shadow Fight Silhouetted Art Layers ---
    this.silhouetteLayer = document.createElement("canvas");
    this.silhouetteLayer.width = Math.floor(w * this.dpr);
    this.silhouetteLayer.height = Math.floor(h * this.dpr);
    const sCtx = this.silhouetteLayer.getContext("2d")!;
    sCtx.scale(this.dpr, this.dpr);

    // Layer A: Distant Misty Mountain Ridges (Mount Fuji silhouette on right)
    sCtx.fillStyle = "rgba(40, 10, 35, 0.62)";
    sCtx.beginPath();
    sCtx.moveTo(0, h * 0.78);
    sCtx.lineTo(w * 0.18, h * 0.68);
    sCtx.lineTo(w * 0.38, h * 0.74);
    sCtx.lineTo(w * 0.55, h * 0.66);
    // Mount Fuji Cone Silhouette
    sCtx.lineTo(w * 0.7, h * 0.58);
    sCtx.lineTo(w * 0.76, h * 0.48); // Mount Fuji Crest
    sCtx.lineTo(w * 0.78, h * 0.48);
    sCtx.lineTo(w * 0.84, h * 0.6);
    sCtx.lineTo(w, h * 0.7);
    sCtx.lineTo(w, h);
    sCtx.lineTo(0, h);
    sCtx.closePath();
    sCtx.fill();

    // Layer B: Midground Ridge & Architecture (Japanese Pagoda & Torii Gate)
    sCtx.fillStyle = "#14071b"; // Deep Shadow Fight silhouette ink
    sCtx.beginPath();
    sCtx.moveTo(0, h * 0.82);
    sCtx.bezierCurveTo(w * 0.25, h * 0.75, w * 0.45, h * 0.85, w * 0.68, h * 0.79);
    sCtx.bezierCurveTo(w * 0.82, h * 0.74, w * 0.92, h * 0.8, w, h * 0.77);
    sCtx.lineTo(w, h);
    sCtx.lineTo(0, h);
    sCtx.closePath();
    sCtx.fill();

    // Traditional Japanese Pagoda Silhouette (Left midground)
    this.drawPagoda(sCtx, w * 0.14, h * 0.82, Math.min(w, h) * 0.28);

    // Torii Gate Silhouette (Center-right ridge)
    this.drawToriiGate(sCtx, w * 0.62, h * 0.8, Math.min(w, h) * 0.08);

    // Shadow Fight Dueling Samurai Silhouette near Torii
    this.drawDuelingWarriors(sCtx, w * 0.49, h * 0.81, Math.min(w, h) * 0.085);

    // Layer C: Intricate Foreground Cherry Blossom (Sakura) Branches (Top-Left & Top-Right)
    this.drawSakuraBranches(sCtx, w, h);
  }

  // Draw traditional multi-tier Japanese Pagoda
  private drawPagoda(ctx: CanvasRenderingContext2D, cx: number, baseY: number, totalHeight: number) {
    ctx.save();
    ctx.fillStyle = "#0c0412"; // Deep ink black

    const tiers = 4;
    const tierH = totalHeight / (tiers + 1.2);
    let curY = baseY;

    // Spire (Sorin)
    ctx.beginPath();
    ctx.moveTo(cx - 2, curY - totalHeight);
    ctx.lineTo(cx, curY - totalHeight - tierH * 0.6);
    ctx.lineTo(cx + 2, curY - totalHeight);
    ctx.fill();

    for (let i = 0; i < tiers; i++) {
      const wEaves = (totalHeight * 0.32) * (1 - i * 0.16);
      const hRoof = tierH * 0.65;
      const curTierTop = curY - (i + 1) * tierH;

      // Eaves with graceful curved Japanese upturns
      ctx.beginPath();
      ctx.moveTo(cx - wEaves * 0.5, curTierTop + hRoof);
      ctx.quadraticCurveTo(cx - wEaves * 0.62, curTierTop + hRoof - 4, cx - wEaves * 0.7, curTierTop + hRoof - 10);
      ctx.lineTo(cx - wEaves * 0.45, curTierTop + 4);
      ctx.lineTo(cx, curTierTop);
      ctx.lineTo(cx + wEaves * 0.45, curTierTop + 4);
      ctx.lineTo(cx + wEaves * 0.7, curTierTop + hRoof - 10);
      ctx.quadraticCurveTo(cx + wEaves * 0.62, curTierTop + hRoof - 4, cx + wEaves * 0.5, curTierTop + hRoof);
      ctx.closePath();
      ctx.fill();

      // Tier pillar body
      ctx.fillRect(cx - wEaves * 0.22, curTierTop + hRoof, wEaves * 0.44, tierH * 0.35);
    }
    ctx.restore();
  }

  // Draw traditional Japanese Shinto Torii Gate
  private drawToriiGate(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.fillStyle = "#0c0412";

    const w = scale * 0.9;
    const h = scale * 0.95;

    // Pillars (Hashira) with slight inward tilt
    ctx.fillRect(x - w * 0.38, y - h, w * 0.08, h);
    ctx.fillRect(x + w * 0.3, y - h, w * 0.08, h);

    // Kasagi (Top crossbar with curved upturned ends)
    ctx.beginPath();
    ctx.moveTo(x - w * 0.58, y - h - h * 0.12);
    ctx.quadraticCurveTo(x, y - h - h * 0.06, x + w * 0.58, y - h - h * 0.12);
    ctx.lineTo(x + w * 0.54, y - h);
    ctx.quadraticCurveTo(x, y - h + h * 0.04, x - w * 0.54, y - h);
    ctx.closePath();
    ctx.fill();

    // Shimaki & Nuki (Secondary crossbars)
    ctx.fillRect(x - w * 0.46, y - h * 0.8, w * 0.92, h * 0.06);

    // Central tablet strut (Gakuzuka)
    ctx.fillRect(x - w * 0.035, y - h, w * 0.07, h * 0.22);
    ctx.restore();
  }

  private drawDuelingWarriors(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    scale: number
  ) {
    ctx.save();
    ctx.fillStyle = "#09030f";
    ctx.strokeStyle = "#f59e0b";

    // Left Samurai (Stance)
    const lx = cx - scale * 0.55;
    ctx.beginPath();
    ctx.arc(lx, baseY - scale * 0.62, scale * 0.09, 0, Math.PI * 2);
    ctx.fill();
    // Flowing crimson headband ribbon
    ctx.save();
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.moveTo(lx - scale * 0.06, baseY - scale * 0.64);
    ctx.quadraticCurveTo(
      lx - scale * 0.26,
      baseY - scale * 0.72,
      lx - scale * 0.36,
      baseY - scale * 0.56
    );
    ctx.lineTo(lx - scale * 0.08, baseY - scale * 0.59);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(lx - scale * 0.14, baseY);
    ctx.lineTo(lx - scale * 0.06, baseY - scale * 0.36);
    ctx.lineTo(lx - scale * 0.08, baseY - scale * 0.53);
    ctx.lineTo(lx + scale * 0.12, baseY - scale * 0.51);
    ctx.lineTo(lx + scale * 0.08, baseY - scale * 0.32);
    ctx.lineTo(lx + scale * 0.16, baseY);
    ctx.closePath();
    ctx.fill();

    // Katana glint
    ctx.lineWidth = Math.max(1.2, scale * 0.025);
    ctx.beginPath();
    ctx.moveTo(lx + scale * 0.1, baseY - scale * 0.44);
    ctx.lineTo(lx + scale * 0.44, baseY - scale * 0.66);
    ctx.stroke();

    // Right Ronin with Straw Hat (Facing Left)
    const rx = cx + scale * 0.65;
    ctx.beginPath();
    ctx.moveTo(rx - scale * 0.24, baseY - scale * 0.63);
    ctx.lineTo(rx, baseY - scale * 0.78);
    ctx.lineTo(rx + scale * 0.24, baseY - scale * 0.63);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rx - scale * 0.16, baseY);
    ctx.lineTo(rx - scale * 0.07, baseY - scale * 0.34);
    ctx.lineTo(rx - scale * 0.1, baseY - scale * 0.52);
    ctx.lineTo(rx + scale * 0.09, baseY - scale * 0.54);
    ctx.lineTo(rx + scale * 0.07, baseY - scale * 0.32);
    ctx.lineTo(rx + scale * 0.18, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#fb7185";
    ctx.beginPath();
    ctx.moveTo(rx - scale * 0.09, baseY - scale * 0.45);
    ctx.lineTo(rx - scale * 0.43, baseY - scale * 0.62);
    ctx.stroke();

    ctx.restore();
  }

  // Draw silhouetted Japanese Cherry Blossom branches framing the top corners
  private drawSakuraBranches(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = "#09030e";
    ctx.strokeStyle = "#09030e";
    ctx.lineCap = "round";

    // --- Branch 1: Sweeping in from Top-Right ---
    const drawBranch = (startX: number, startY: number, length: number, angle: number, depth: number) => {
      if (depth === 0 || length < 10) return;

      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;

      ctx.lineWidth = Math.max(depth * 2.2, 1.5);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        (startX + endX) * 0.5 + (Math.random() - 0.5) * 16,
        (startY + endY) * 0.5 + (Math.random() - 0.5) * 16,
        endX,
        endY
      );
      ctx.stroke();

      // Hanging clusters of delicate blossoms on branch tips
      if (depth <= 2) {
        ctx.save();
        ctx.fillStyle = "rgba(10, 4, 15, 0.95)";
        for (let b = 0; b < 4; b++) {
          const bx = endX + (Math.random() - 0.5) * 22;
          const by = endY + (Math.random() - 0.5) * 20;
          ctx.beginPath();
          ctx.arc(bx, by, 3.5 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Branch forks
      drawBranch(endX, endY, length * 0.72, angle + 0.35 + (Math.random() * 0.2 - 0.1), depth - 1);
      drawBranch(endX, endY, length * 0.65, angle - 0.45 + (Math.random() * 0.2 - 0.1), depth - 1);
    };

    // Seeded branches for predictable beauty
    drawBranch(w * 1.02, h * 0.02, Math.min(w, h) * 0.38, Math.PI * 0.92, 5);
    drawBranch(w * 0.98, h * 0.12, Math.min(w, h) * 0.28, Math.PI * 0.88, 4);

    // --- Branch 2: Sweeping in from Top-Left ---
    drawBranch(-w * 0.02, h * 0.01, Math.min(w, h) * 0.32, Math.PI * 0.12, 4);
    drawBranch(-w * 0.01, h * 0.09, Math.min(w, h) * 0.22, Math.PI * 0.18, 3);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 3D Tumbling Falling Sakura Petals Particle Engine
  // ---------------------------------------------------------------------------
  private initPetals() {
    this.petals = [];
    const colors = [
      "#ffd1dc", // Soft cherry blossom pink
      "#f472b6", // Vivid sakura rose
      "#fb7185", // Twilight petal crimson
      "#fce7f3", // Pale moonlight pink
      "#e11d48", // Deep magenta petal accent
    ];

    for (let i = 0; i < this.petalCount; i++) {
      const z = 0.35 + Math.pow(Math.random(), 1.4) * 0.85; // Depth factor
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        z,
        vx: 0.6 + Math.random() * 1.2,
        vy: 1.0 + Math.random() * 1.6,
        size: (8 + Math.random() * 10) * z,
        angleX: Math.random() * Math.PI * 2,
        angleY: Math.random() * Math.PI * 2,
        angleZ: Math.random() * Math.PI * 2,
        spinX: (Math.random() - 0.5) * 2.8,
        spinY: (Math.random() - 0.5) * 3.4,
        spinZ: (Math.random() - 0.5) * 1.8,
        colorIndex: Math.floor(Math.random() * colors.length),
        petalType: Math.random() < 0.3 ? 1 : 0, // 0 = standard curved petal, 1 = notched petal
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Ambient Twilight Firefly Embers
  // ---------------------------------------------------------------------------
  private initEmbers() {
    this.embers = [];
    for (let i = 0; i < this.emberCount; i++) {
      this.embers.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 1.2 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.3 + Math.random() * 0.6), // Floating gently upward
        alpha: Math.random(),
        pulseSpeed: 1.5 + Math.random() * 3.0,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // User Input & Interactive Wind Mechanics
  // ---------------------------------------------------------------------------
  private initEvents() {
    const on = (evt: string, fn: EventListenerOrEventListenerObject) => {
      window.addEventListener(evt, fn, { passive: true });
      this.removeListeners.push(() => window.removeEventListener(evt, fn));
    };

    on("mousemove", (e: Event) => {
      const me = e as MouseEvent;
      const rect = this.canvas.getBoundingClientRect();
      const currentX = me.clientX - rect.left;
      const currentY = me.clientY - rect.top;

      if (this.mouse.active) {
        this.mouse.vx = (currentX - this.mouse.lastX) * 0.15;
        this.mouse.vy = (currentY - this.mouse.lastY) * 0.15;
      }
      this.mouse.lastX = currentX;
      this.mouse.lastY = currentY;
      this.mouse.x = currentX;
      this.mouse.y = currentY;
      this.mouse.active = true;
    });

    on("mouseleave", () => {
      this.mouse.active = false;
      this.mouse.vx = 0;
      this.mouse.vy = 0;
    });

    // Tap or Click triggers an Anime Petal Spiral Wind Burst + Katana Slash Spark
    on("pointerdown", (e: Event) => {
      const pe = e as PointerEvent;
      const rect = this.canvas.getBoundingClientRect();
      this.spawnSlash(pe.clientX - rect.left, pe.clientY - rect.top);
      this.triggerWindGust();
    });

    const handleResize = () => {
      this.initSize();
      this.renderStaticLayers();
    };
    on("resize", handleResize);
  }

  public triggerWindGust() {
    this.windBurst = 3.2; // Brief strong gust of wind
  }

  public spawnSlash(x: number, y: number) {
    this.slashes.push({
      x,
      y,
      angle: -Math.PI * 0.35 + (Math.random() - 0.5) * 0.9,
      length: 110 + Math.random() * 80,
      life: 0.35,
      maxLife: 0.35,
    });
  }

  private renderSlashes(dt: number) {
    if (this.slashes.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
        continue;
      }
      const progress = 1 - s.life / s.maxLife;
      const alpha = Math.sin((s.life / s.maxLife) * Math.PI);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      const grad = ctx.createLinearGradient(-s.length * 0.5, 0, s.length * 0.5, 0);
      grad.addColorStop(0, "rgba(225, 29, 72, 0)");
      grad.addColorStop(0.5, `rgba(251, 191, 36, ${alpha * 0.9})`);
      grad.addColorStop(1, "rgba(225, 29, 72, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = (1 - progress * 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(-s.length * 0.5, 0);
      ctx.quadraticCurveTo(0, -14 * alpha, s.length * 0.5, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Main Animation & Render Loop
  // ---------------------------------------------------------------------------
  private loop = () => {
    if (this.destroyed || this.isPaused) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const now = performance.now() * 0.001;
    const dt = Math.min(Math.max(now - this.lastTime, 0.001), 0.1);
    this.lastTime = now;

    // Decay wind burst
    this.windBurst *= Math.pow(0.35, dt);
    const effectiveWind = this.baseWind + this.windBurst;

    // 1. Draw Pre-rendered Sky & Sun
    if (this.bgLayer) {
      this.ctx.drawImage(this.bgLayer, 0, 0, this.width, this.height);
    }

    // 2. Draw Floating Firefly Embers
    this.renderEmbers(now, dt);

    // 3. Draw Pre-rendered Silhouettes (Mountains, Pagoda, Torii, Sakura Branches)
    if (this.silhouetteLayer) {
      this.ctx.drawImage(this.silhouetteLayer, 0, 0, this.width, this.height);
    }

    // 4. Update & Draw Dynamic 3D Falling Sakura Petals
    if (this.petalsEnabled) {
      this.renderPetals(now, dt, effectiveWind);
    }

    // 4b. Draw Interactive Katana Click Slashes
    this.renderSlashes(dt);

    // 5. Blit Shadow Fight Cinematic Film Grain
    if (this.grainEnabled && this.grainPattern) {
      this.renderFilmGrain();
    }
  };

  private renderEmbers(time: number, dt: number) {
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < this.embers.length; i++) {
      const e = this.embers[i];
      e.y += e.vy * dt * 45;
      e.x += e.vx * dt * 45 + Math.sin(time * 0.8 + e.y * 0.02) * 0.4;

      if (e.y < -10) e.y = this.height + 10;
      if (e.x < -10) e.x = this.width + 10;
      if (e.x > this.width + 10) e.x = -10;

      const pulse = 0.5 + 0.5 * Math.sin(time * e.pulseSpeed + i);
      const alpha = 0.2 + pulse * 0.65;

      ctx.fillStyle = `rgba(254, 215, 170, ${alpha})`;
      ctx.shadowColor = "#f97316";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderPetals(time: number, dt: number, wind: number) {
    const ctx = this.ctx;
    const colors = ["#ffd1dc", "#f472b6", "#fb7185", "#fce7f3", "#e11d48"];

    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];

      // Physics update: Fall downward with sinusoidal sway & wind drift
      p.angleX += p.spinX * dt;
      p.angleY += p.spinY * dt;
      p.angleZ += p.spinZ * dt;

      // Natural gentle breeze sway
      const sway = Math.sin(time * 1.5 + p.y * 0.015 + i) * 1.2;
      p.x += (p.vx + wind + sway) * p.z * dt * 50;
      p.y += (p.vy + this.windBurst * 0.3) * p.z * dt * 50;

      // Interactive mouse displacement (petals scatter away from mouse movement)
      if (this.mouse.active) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (1 - dist / 120) * 8.0;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
          p.spinX += force * 0.2;
          p.spinY += force * 0.2;
        }
      }

      // Screen boundary wrapping
      if (p.y > this.height + 25) {
        p.y = -20;
        p.x = Math.random() * (this.width + 100) - 50;
      }
      if (p.x > this.width + 40) {
        p.x = -30;
      } else if (p.x < -40) {
        p.x = this.width + 30;
      }

      // 3D Perspective Projection Matrix
      const scaleX = Math.cos(p.angleX);
      const scaleY = Math.cos(p.angleY);
      const curSize = p.size;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angleZ);
      ctx.scale(scaleX, scaleY);

      // Draw curved Japanese Cherry Blossom Petal
      const col = colors[p.colorIndex];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, -curSize);
      ctx.bezierCurveTo(curSize * 0.75, -curSize * 0.7, curSize * 0.9, curSize * 0.35, 0, curSize);
      ctx.bezierCurveTo(-curSize * 0.9, curSize * 0.35, -curSize * 0.75, -curSize * 0.7, 0, -curSize);
      ctx.closePath();
      ctx.fill();

      // Delicate petal central vein
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -curSize * 0.6);
      ctx.lineTo(0, curSize * 0.5);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderFilmGrain() {
    if (!this.grainPattern) return;
    const ctx = this.ctx;
    ctx.save();
    // Offset jitter creates the authentic analog flicker of Shadow Fight
    const jitterX = (Math.random() - 0.5) * 64;
    const jitterY = (Math.random() - 0.5) * 64;

    ctx.globalAlpha = 0.075;
    ctx.globalCompositeOperation = "overlay";

    const pattern = ctx.createPattern(this.grainPattern, "repeat");
    if (pattern) {
      ctx.translate(jitterX, jitterY);
      ctx.fillStyle = pattern;
      ctx.fillRect(-64, -64, this.width + 128, this.height + 128);
    }
    ctx.restore();
  }

  public setGrain(enabled: boolean) {
    this.grainEnabled = enabled;
  }

  public setPetals(enabled: boolean) {
    this.petalsEnabled = enabled;
  }

  public destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animFrameId);
    this.removeListeners.forEach((off) => off());
    this.canvas.remove();
  }
}

// -----------------------------------------------------------------------------
// Procedural Japanese Pentatonic Koto & Ambient Wind Synthesizer (Web Audio)
// -----------------------------------------------------------------------------
export class AnimeAudioStore {
  private ctx: AudioContext | null = null;
  private isMuted = true;
  private timer: number | null = null;

  // Japanese Insen / Hirajoshi Pentatonic Scale (D, Eb, G, A, Bb)
  private readonly scale = [293.66, 311.13, 392.0, 440.0, 466.16, 587.33, 622.25];

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.start();
    } else {
      this.stop();
    }
    return this.isMuted;
  }

  private start() {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    // Play periodic soothing koto plucks
    const playNote = () => {
      if (this.isMuted || !this.ctx) return;
      const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, this.ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.9);

      const nextDelay = 2200 + Math.random() * 3400;
      this.timer = window.setTimeout(playNote, nextDelay);
    };

    playNote();
  }

  private stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public destroy() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
