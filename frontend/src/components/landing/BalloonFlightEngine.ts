import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/*
 * Sunrise Balloon Valley — Infinite Dawn Flight Engine
 *
 * Full-page background 3D WebGL experience.
 * Hundreds of distinct, colorful hot air balloons floating over
 * Cappadocia canyon ridges and low-altitude morning clouds.
 */

const W = 160;
const D = 140;
const AHEAD = 110;
const TAU = Math.PI * 2;

const GLSL_WORLD = /* glsl */ `
  #define TAU 6.28318530718
  const float W = ${W.toFixed(1)};
  const float D = ${D.toFixed(1)};

  float pathX(float z) {
    return 16.0 * sin(TAU * z / D) + 7.0 * sin(TAU * 2.0 * z / D + 1.2);
  }

  float wrapDx(float x, float z) {
    return mod(x - pathX(z) + W * 0.5, W) - W * 0.5;
  }
`;

function pathX(z: number) {
  return 16 * Math.sin((TAU * z) / D) + 7 * Math.sin((TAU * 2 * z) / D + 1.2);
}

export class BalloonFlightEngine {
  private container: HTMLElement;
  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer?: EffectComposer;
  private bloomPass?: UnrealBloomPass;

  private balloonGeometry?: THREE.BufferGeometry;
  private balloonMaterial?: THREE.ShaderMaterial;
  private atlas?: THREE.Texture;

  private cloudGeometry?: THREE.BufferGeometry;
  private cloudMaterial?: THREE.ShaderMaterial;

  private sparkGeometry?: THREE.BufferGeometry;
  private sparkMaterial?: THREE.ShaderMaterial;

  private animFrameId = 0;
  private startTime = 0;
  private lastTime = 0;
  private destroyed = false;
  private paused = false;

  private camZ = 0;
  private velocity = 0;
  private idleSpeed: number;

  private mouse = new THREE.Vector2(0, 0);
  private targetMouse = new THREE.Vector2(0, 0);
  private cursor = new THREE.Vector2(-9, -9);

  private burnerProgress = 0;
  private isBurnerActive = false;

  private removeListeners: Array<() => void> = [];

  constructor(container: HTMLElement, onLoaded?: () => void) {
    this.container = container;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    this.idleSpeed = reduced ? 0.35 : 1.7;

    const { width, height } = this.size();
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 600);

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      onLoaded?.();
      return;
    }

    this.renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2.0));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Natural Crisp Sky Blue Gradient (Deep Azure Zenith to Airy Pale Blue Horizon)
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 4;
    skyCanvas.height = 512;
    const sCtx = skyCanvas.getContext("2d")!;
    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0.0, "#0284c7"); // Zenith: Deep sky blue
    skyGrad.addColorStop(0.3, "#38bdf8"); // Upper sky: Vibrant cyan-blue
    skyGrad.addColorStop(0.65, "#7dd3fc"); // Mid sky: Soft airy sky blue
    skyGrad.addColorStop(0.88, "#bae6fd"); // Near horizon: Pale blue
    skyGrad.addColorStop(1.0, "#e0f2fe"); // Horizon: Very pale crisp blue
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 4, 512);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = skyTex;

    this.initBalloons(360);
    // Cloud sea and thermal sparks removed to eliminate all milky white fog and glowing overlays
    this.initPost();
    this.initEvents();

    this.startTime = performance.now() * 0.001;
    this.lastTime = this.startTime;
    this.animate();
    onLoaded?.();
  }

  private size() {
    return {
      width: this.container.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1200),
      height: this.container.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 800),
    };
  }

  private projScale() {
    const h = this.renderer ? this.renderer.getDrawingBufferSize(new THREE.Vector2()).y : 900;
    return h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
  }

  // ---------------------------------------------------------------------------
  // Ultra-Crisp Canvas Balloon Sprite Atlas
  // ---------------------------------------------------------------------------
  private createAtlas(): THREE.Texture {
    const T = 512;
    const canvas = document.createElement("canvas");
    canvas.width = T * 4;
    canvas.height = T * 2;
    const ctx = canvas.getContext("2d")!;

    const drawTile = (idx: number, draw: (cx: number, cy: number) => void) => {
      const cx = (idx % 4) * T + T / 2;
      const cy = Math.floor(idx / 4) * T + T / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - T / 2, cy - T / 2, T, T);
      ctx.clip();
      draw(cx, cy);
      ctx.restore();
    };

    const renderBalloon = (
      cx: number,
      cy: number,
      colors: string[],
      pattern: "striped" | "chevron" | "checker"
    ) => {
      const topY = cy - 130;
      const envelopeRadius = 125;
      const skirtY = cy + 60;
      const basketY = cy + 145;

      // 1. Balloon Envelope Path
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 36, skirtY);
      ctx.bezierCurveTo(cx - 75, cy + 25, cx - envelopeRadius, cy - 35, cx - envelopeRadius, topY + 45);
      ctx.bezierCurveTo(
        cx - envelopeRadius,
        topY - envelopeRadius * 0.55,
        cx + envelopeRadius,
        topY - envelopeRadius * 0.55,
        cx + envelopeRadius,
        topY + 45
      );
      ctx.bezierCurveTo(cx + envelopeRadius, cy - 35, cx + 75, cy + 25, cx + 36, skirtY);
      ctx.closePath();
      ctx.clip();

      // Colored Vertical Gores (Stripes)
      const numGores = 12;
      for (let g = 0; g < numGores; g++) {
        const t0 = g / numGores;
        const t1 = (g + 1) / numGores;
        const color = colors[g % colors.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        const gx0 = cx - envelopeRadius + t0 * (envelopeRadius * 2);
        const gx1 = cx - envelopeRadius + t1 * (envelopeRadius * 2);
        ctx.rect(gx0, topY - 120, gx1 - gx0, 320);
        ctx.fill();

        if (pattern === "chevron" && g % 2 === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.beginPath();
          ctx.moveTo(gx0, cy - 20);
          ctx.lineTo((gx0 + gx1) * 0.5, cy - 45);
          ctx.lineTo(gx1, cy - 20);
          ctx.fill();
        }
      }

      // 3D Spherical Volume Shading
      const grad = ctx.createRadialGradient(cx - 45, topY - 10, 15, cx, cy, envelopeRadius * 1.3);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
      grad.addColorStop(1, "rgba(25, 10, 40, 0.42)");
      ctx.fillStyle = grad;
      ctx.fillRect(cx - envelopeRadius, topY - 120, envelopeRadius * 2, 320);
      ctx.restore();

      // Envelope Outline for crisp contrast
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 36, skirtY);
      ctx.bezierCurveTo(cx - 75, cy + 25, cx - envelopeRadius, cy - 35, cx - envelopeRadius, topY + 45);
      ctx.bezierCurveTo(
        cx - envelopeRadius,
        topY - envelopeRadius * 0.55,
        cx + envelopeRadius,
        topY - envelopeRadius * 0.55,
        cx + envelopeRadius,
        topY + 45
      );
      ctx.bezierCurveTo(cx + envelopeRadius, cy - 35, cx + 75, cy + 25, cx + 36, skirtY);
      ctx.strokeStyle = "rgba(40, 20, 60, 0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // 2. Suspension Rigging
      ctx.strokeStyle = "rgba(60, 45, 65, 0.8)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 28, skirtY);
      ctx.lineTo(cx - 16, basketY);
      ctx.moveTo(cx + 28, skirtY);
      ctx.lineTo(cx + 16, basketY);
      ctx.moveTo(cx - 14, skirtY);
      ctx.lineTo(cx - 12, basketY);
      ctx.moveTo(cx + 14, skirtY);
      ctx.lineTo(cx + 12, basketY);
      ctx.stroke();

      // 3. Glowing Burner Flame
      const burnerGrad = ctx.createRadialGradient(cx, skirtY + 22, 2, cx, skirtY + 22, 24);
      burnerGrad.addColorStop(0, "rgba(255, 255, 230, 1.0)");
      burnerGrad.addColorStop(0.35, "rgba(255, 160, 30, 0.9)");
      burnerGrad.addColorStop(1, "rgba(255, 50, 0, 0.0)");
      ctx.fillStyle = burnerGrad;
      ctx.beginPath();
      ctx.arc(cx, skirtY + 22, 24, 0, TAU);
      ctx.fill();

      // 4. Wicker Basket
      ctx.fillStyle = "#8a5834";
      ctx.beginPath();
      ctx.roundRect(cx - 22, basketY, 44, 30, 5);
      ctx.fill();
      ctx.strokeStyle = "rgba(40, 20, 10, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#5c371d";
      ctx.fillRect(cx - 19, basketY + 8, 38, 4);
      ctx.fillRect(cx - 19, basketY + 18, 38, 4);
    };

    // Balloon 0: ArcPay Signature Lavender, Violet & Ivory
    drawTile(0, (cx, cy) =>
      renderBalloon(cx, cy, ["#7c3aed", "#f3e8ff", "#9333ea", "#c084fc", "#ffffff"], "striped")
    );

    // Balloon 1: Sunrise Coral, Crimson & Gold
    drawTile(1, (cx, cy) =>
      renderBalloon(cx, cy, ["#e11d48", "#f97316", "#facc15", "#fff1f2", "#fb7185"], "chevron")
    );

    // Balloon 2: Aegean Cyan, Sky Blue & White
    drawTile(2, (cx, cy) =>
      renderBalloon(cx, cy, ["#0284c7", "#38bdf8", "#e0f2fe", "#0369a1", "#ffffff"], "striped")
    );

    // Balloon 3: Emerald Mint & Champagne
    drawTile(3, (cx, cy) =>
      renderBalloon(cx, cy, ["#059669", "#34d399", "#d1fae5", "#fef3c7", "#10b981"], "chevron")
    );

    // Balloon 4: Royal Midnight Plum & Golden Honey
    drawTile(4, (cx, cy) =>
      renderBalloon(cx, cy, ["#4c1d95", "#6d28d9", "#f59e0b", "#fde68a", "#db2777"], "striped")
    );

    // Balloon 5: Vibrant Rainbow Festival
    drawTile(5, (cx, cy) =>
      renderBalloon(cx, cy, ["#ef4444", "#f97316", "#eab308", "#10b981", "#06b6d4", "#8b5cf6"], "striped")
    );

    // Cloud Puffs (Tile 6 & 7)
    const drawCloud = (cx: number, cy: number, tint: string) => {
      ctx.fillStyle = tint;
      for (const [ox, oy, r] of [
        [-50, 15, 60],
        [50, 20, 55],
        [0, -5, 75],
        [-90, 35, 45],
        [90, 35, 45],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, r, 0, TAU);
        ctx.fill();
      }
    };
    drawTile(6, (cx, cy) => drawCloud(cx, cy, "rgba(255, 245, 252, 0.85)"));
    drawTile(7, (cx, cy) => drawCloud(cx, cy, "rgba(240, 235, 255, 0.75)"));

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  // ---------------------------------------------------------------------------
  // Balloon Fleet Points
  // ---------------------------------------------------------------------------
  private initBalloons(count: number) {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const kind = new Float32Array(count);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * W * 1.3;
      pos[i3 + 1] = 6 + Math.random() * 36; // Altitudes: 6m to 42m
      pos[i3 + 2] = Math.random() * D;

      size[i] = 3.2 + Math.pow(Math.random(), 1.4) * 3.6;
      kind[i] = Math.floor(Math.random() * 6);
      seed[i] = Math.random();
    }

    this.balloonGeometry = new THREE.BufferGeometry();
    this.balloonGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.balloonGeometry.setAttribute("size", new THREE.BufferAttribute(size, 1));
    this.balloonGeometry.setAttribute("kind", new THREE.BufferAttribute(kind, 1));
    this.balloonGeometry.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    this.balloonGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    this.atlas = this.createAtlas();

    this.balloonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAtlas: { value: this.atlas },
        uCam: { value: new THREE.Vector2() },
        uCursor: { value: new THREE.Vector2(-9, -9) },
        uBurner: { value: 0 },
        uProj: { value: this.projScale() },
      },
      vertexShader: /* glsl */ `
        ${GLSL_WORLD}
        uniform float uTime;
        uniform vec2 uCam;
        uniform vec2 uCursor;
        uniform float uBurner;
        uniform float uProj;

        attribute float size;
        attribute float kind;
        attribute float seed;

        varying float vKind;
        varying float vFog;
        varying float vGlow;

        void main() {
          vec3 p = position;

          // Wrap around moving camera
          float x0 = uCam.x - W * 0.5;
          float z0 = uCam.y - ${AHEAD.toFixed(1)};
          p.x = x0 + mod(position.x - x0, W);
          p.z = z0 + mod(position.z - z0, D);

          // Gentle thermal floating
          float bob = sin(uTime * 0.75 + seed * 20.0) * 1.1;
          float sway = sin(uTime * 0.45 + seed * 10.0) * 0.6;
          p.y += bob;
          p.x += sway;

          // Burner lift boost
          p.y += uBurner * (3.0 + seed * 6.0);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = -mv.z;

          vec4 clip = projectionMatrix * mv;
          vec2 ndc = clip.xy / clip.w;
          float md = length(ndc - uCursor);
          vGlow = smoothstep(0.25, 0.0, md);

          gl_PointSize = clamp(size * uProj / max(dist, 0.6), 0.0, 480.0);
          gl_Position = clip;

          // Clear, extended fog range so balloons remain sharp and visible
          vFog = exp(-pow(max(dist - 14.0, 0.0) / 125.0, 1.8));
          vKind = kind;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas;
        uniform float uBurner;
        varying float vKind;
        varying float vFog;
        varying float vGlow;

        void main() {
          vec2 pc = gl_PointCoord;
          float k = floor(vKind + 0.5);
          vec2 tile = vec2(mod(k, 4.0), floor(k / 4.0));
          vec2 uv = (tile + pc) / vec2(4.0, 2.0);

          // Crucial: flip Y coordinate to match WebGL canvas texture coordinate space
          uv.y = 1.0 - uv.y;

          vec4 tex = texture2D(uAtlas, uv);
          if (tex.a < 0.15) discard;

          vec3 col = tex.rgb;

          // Pure, natural hot air balloon colors against blue sky — NO GLOW
          vec3 skyHaze = vec3(0.55, 0.78, 0.95);
          col = mix(skyHaze, col, vFog * 0.75 + 0.25);

          gl_FragColor = vec4(col, tex.a);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const fleet = new THREE.Points(this.balloonGeometry, this.balloonMaterial);
    fleet.frustumCulled = false;
    this.scene.add(fleet);
  }

  // ---------------------------------------------------------------------------
  // Low-Altitude Sea of Clouds (Deep in the canyon floor, below the balloons)
  // ---------------------------------------------------------------------------
  private initCloudSea(count: number) {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * W * 1.6;
      pos[i3 + 1] = -16 + Math.random() * 8; // Deep below balloons (y = -16 to -8)
      pos[i3 + 2] = Math.random() * D;
      size[i] = 16 + Math.random() * 24;
    }
    this.cloudGeometry = new THREE.BufferGeometry();
    this.cloudGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.cloudGeometry.setAttribute("size", new THREE.BufferAttribute(size, 1));
    this.cloudGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    this.cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAtlas: { value: this.atlas },
        uCam: this.balloonMaterial!.uniforms.uCam,
        uProj: this.balloonMaterial!.uniforms.uProj,
      },
      vertexShader: /* glsl */ `
        ${GLSL_WORLD}
        uniform float uTime;
        uniform vec2 uCam;
        uniform float uProj;
        attribute float size;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float x0 = uCam.x - W * 0.5;
          float z0 = uCam.y - ${AHEAD.toFixed(1)};
          p.x = x0 + mod(position.x - x0 + sin(uTime * 0.08) * 3.0, W);
          p.z = z0 + mod(position.z - z0, D);
          p.y += sin(uTime * 0.25 + p.x * 0.04) * 0.5;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = -mv.z;
          gl_PointSize = clamp(size * uProj / dist, 0.0, 380.0);
          gl_Position = projectionMatrix * mv;
          vAlpha = exp(-pow(dist / 90.0, 2.0)) * 0.35;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas;
        varying float vAlpha;
        void main() {
          vec2 uv = (vec2(2.0, 0.0) + gl_PointCoord) / vec2(4.0, 2.0);
          uv.y = 1.0 - uv.y;
          vec4 tex = texture2D(uAtlas, uv);
          gl_FragColor = vec4(vec3(0.97, 0.94, 0.99) * tex.rgb, tex.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const clouds = new THREE.Points(this.cloudGeometry, this.cloudMaterial);
    clouds.frustumCulled = false;
    this.scene.add(clouds);
  }

  // ---------------------------------------------------------------------------
  // Thermal Sun Sparks
  // ---------------------------------------------------------------------------
  private initThermalSparks(count: number) {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * W;
      pos[i * 3 + 1] = Math.random() * 45;
      pos[i * 3 + 2] = Math.random() * D;
      seed[i] = Math.random();
    }
    this.sparkGeometry = new THREE.BufferGeometry();
    this.sparkGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.sparkGeometry.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    this.sparkGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    this.sparkMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCam: this.balloonMaterial!.uniforms.uCam,
        uProj: this.balloonMaterial!.uniforms.uProj,
      },
      vertexShader: /* glsl */ `
        ${GLSL_WORLD}
        uniform float uTime;
        uniform vec2 uCam;
        uniform float uProj;
        attribute float seed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float x0 = uCam.x - W * 0.5;
          float z0 = uCam.y - ${AHEAD.toFixed(1)};
          p.x = x0 + mod(position.x - x0, W);
          p.z = z0 + mod(position.z - z0, D);
          p.y += sin(uTime * 0.6 + seed * 20.0) * 1.5;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = -mv.z;
          gl_PointSize = clamp((0.12 + seed * 0.1) * uProj / dist, 1.0, 12.0);
          gl_Position = projectionMatrix * mv;
          vAlpha = (0.5 + 0.5 * sin(uTime * 3.0 + seed * 40.0)) * exp(-pow(dist / 60.0, 2.0));
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(vec3(1.0, 0.88, 0.65), a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    sparks.frustumCulled = false;
    this.scene.add(sparks);
  }

  private initPost() {
    // Pure, crisp direct WebGL rendering with no artificial bloom/glow
  }

  private initEvents() {
    const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void) => {
      window.addEventListener(type, fn, { passive: true });
      this.removeListeners.push(() => window.removeEventListener(type, fn));
    };

    on("wheel", (e) => {
      this.velocity += e.deltaY * 0.012;
    });

    on("pointermove", (e) => {
      const x = (e.clientX / (window.innerWidth || 1)) * 2 - 1;
      const y = -(e.clientY / (window.innerHeight || 1)) * 2 + 1;
      this.targetMouse.set(x, y);
      this.cursor.set(x, y);
    });

    on("resize", this.handleResize);
  }

  public igniteBurner(active: boolean) {
    this.isBurnerActive = active;
  }

  public handleResize = () => {
    if (!this.renderer) return;
    const { width, height } = this.size();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer?.setSize(width, height);
    if (this.balloonMaterial) {
      this.balloonMaterial.uniforms.uProj.value = this.projScale();
    }
  };

  private animate = () => {
    if (this.destroyed || this.paused || !this.renderer) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now() * 0.001;
    const dt = Math.min(Math.max(now - this.lastTime, 0.001), 0.1);
    this.lastTime = now;
    const t = now - this.startTime;

    this.burnerProgress += ((this.isBurnerActive ? 1 : 0) - this.burnerProgress) * Math.min(dt * 3.0, 1);

    this.velocity *= Math.pow(0.09, dt);
    this.velocity = THREE.MathUtils.clamp(this.velocity, -35, 55);
    const speed = this.idleSpeed + this.velocity + this.burnerProgress * 1.8;

    this.camZ -= speed * dt;
    if (this.camZ < -D) this.camZ += D;
    if (this.camZ > 0) this.camZ -= D;

    this.mouse.lerp(this.targetMouse, Math.min(dt * 3.2, 1));

    // Smooth gliding camera through balloon altitudes
    const cz = this.camZ;
    const cx = pathX(cz) + this.mouse.x * 4.0;
    const cy = 18 + this.mouse.y * 3.5 + this.burnerProgress * 5.0;
    const lookZ = cz - 28;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(pathX(lookZ) + this.mouse.x * 7.0, cy - 1.2 + this.mouse.y * 4.5, lookZ);
    this.camera.rotateZ(-this.mouse.x * 0.035);

    if (this.balloonMaterial) {
      const u = this.balloonMaterial.uniforms;
      u.uTime.value = t;
      u.uCam.value.set(cx, cz);
      u.uCursor.value.copy(this.cursor);
      u.uBurner.value = this.burnerProgress;
    }
    if (this.cloudMaterial) {
      this.cloudMaterial.uniforms.uTime.value = t;
      this.cloudMaterial.uniforms.uCam.value.set(cx, cz);
    }
    if (this.sparkMaterial) {
      this.sparkMaterial.uniforms.uTime.value = t;
      this.sparkMaterial.uniforms.uCam.value.set(cx, cz);
    }
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animFrameId);
    this.removeListeners.forEach((off) => off());
    this.balloonGeometry?.dispose();
    this.balloonMaterial?.dispose();
    this.cloudGeometry?.dispose();
    this.cloudMaterial?.dispose();
    this.sparkGeometry?.dispose();
    this.sparkMaterial?.dispose();
    this.atlas?.dispose();
    this.composer?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}

// -----------------------------------------------------------------------------
// Procedural Dawn Ambient Audio Synthesizer (Web Audio API)
// -----------------------------------------------------------------------------
export class BalloonAudioStore {
  private ctx: AudioContext | null = null;
  public isMuted = true;
  private masterGain: GainNode | null = null;
  private burnerGain: GainNode | null = null;
  private burnerNoise: AudioBufferSourceNode | null = null;
  private oscillators: OscillatorNode[] = [];

  public initAudio() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(8000, this.ctx.currentTime);

      // Sunrise Major 9th Drone Pad (F# - C# - G# - A#)
      [92.5, 138.6, 185.0, 207.65, 277.18, 415.3].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, this.ctx!.currentTime);
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.06 / (idx + 1), this.ctx!.currentTime);
        osc.connect(g);
        g.connect(filter);
        osc.start();
        this.oscillators.push(osc);
      });

      // Propane Burner Noise Generator (Warm rushing flame whoosh)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.burnerNoise = this.ctx.createBufferSource();
      this.burnerNoise.buffer = noiseBuffer;
      this.burnerNoise.loop = true;

      const burnerFilter = this.ctx.createBiquadFilter();
      burnerFilter.type = "bandpass";
      burnerFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      burnerFilter.Q.setValueAtTime(0.9, this.ctx.currentTime);

      this.burnerGain = this.ctx.createGain();
      this.burnerGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.burnerNoise.connect(burnerFilter);
      burnerFilter.connect(this.burnerGain);
      this.burnerGain.connect(filter);
      this.burnerNoise.start();

      filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch {}
  }

  public toggleMute(): boolean {
    if (!this.ctx || !this.masterGain) {
      this.initAudio();
    }
    if (!this.ctx || !this.masterGain) return true;
    if (this.ctx.state === "suspended") void this.ctx.resume();

    this.isMuted = !this.isMuted;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.32, now + 1.0);
    return this.isMuted;
  }

  public setBurnerActive(active: boolean) {
    if (!this.ctx || !this.burnerGain) return;
    const now = this.ctx.currentTime;
    this.burnerGain.gain.cancelScheduledValues(now);
    this.burnerGain.gain.setValueAtTime(this.burnerGain.gain.value, now);
    this.burnerGain.gain.linearRampToValueAtTime(active ? 0.45 : 0, now + 0.3);
  }

  public destroy() {
    this.oscillators.forEach((o) => {
      try {
        o.stop();
      } catch {}
    });
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
