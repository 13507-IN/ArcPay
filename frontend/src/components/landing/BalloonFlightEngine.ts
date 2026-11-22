import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/*
 * Sunrise Balloon Valley — Infinite Dawn Flight
 *
 * Periodic tile of W x D world units repeating seamlessly around the camera.
 * Balloons float at varied altitudes, bob gently on thermals, and ignite
 * their burners when interacted with.
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
    return 14.0 * sin(TAU * z / D) + 6.0 * sin(TAU * 2.0 * z / D + 1.2);
  }

  float wrapDx(float x, float z) {
    return mod(x - pathX(z) + W * 0.5, W) - W * 0.5;
  }

  float canyonFloor(float x, float z) {
    float dx = wrapDx(x, z);
    float ridges = 3.5 * sin(TAU * 2.0 * x / W + 1.0) * cos(TAU * z / D)
                 + 2.2 * sin(TAU * (3.0 * z / D + x / W));
    return ridges + min(dx * dx * 0.005, 14.0) - 8.0;
  }
`;

function pathX(z: number) {
  return 14 * Math.sin((TAU * z) / D) + 6 * Math.sin((TAU * 2 * z) / D + 1.2);
}

const BalloonPostShader = {
  name: "SunriseBalloonGrade",
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVelocity: { value: 0 },
    uResolution: { value: new THREE.Vector2(1600, 900) },
    uBlur: { value: 10 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVelocity;
    uniform vec2 uResolution;
    uniform float uBlur;
    varying vec2 vUv;

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - vec2(0.5, 0.48);
      float aspect = uResolution.x / uResolution.y;

      float distCenter = length(c * vec2(1.0, 1.4));
      float blur = smoothstep(0.18, 0.65, distCenter);
      blur = clamp(blur + uVelocity * 0.3, 0.0, 1.0);
      float radius = blur * uBlur;

      vec2 px = 1.0 / uResolution;
      float chromatic = (0.0018 + uVelocity * 0.007) * length(c);
      vec3 acc = vec3(0.0);
      float wsum = 0.0;

      for (int i = 0; i < 24; i++) {
        float fi = float(i);
        float r = sqrt((fi + 0.5) / 24.0) * radius;
        float a = fi * 2.39996323;
        vec2 o = vec2(cos(a), sin(a)) * r * px;
        vec2 suv = uv + o;
        vec3 s;
        s.r = texture2D(tDiffuse, suv + c * chromatic).r;
        s.g = texture2D(tDiffuse, suv).g;
        s.b = texture2D(tDiffuse, suv - c * chromatic).b;

        float w = 1.0 + dot(s, vec3(0.35, 0.55, 0.15)) * 2.8 * blur;
        acc += s * w;
        wsum += w;
      }
      vec3 col = acc / wsum;

      vec3 sunriseTint = vec3(1.04, 0.98, 0.95);
      col *= sunriseTint;

      vec2 g = uv * uResolution + vec2(sin(uTime * 35.0), cos(uTime * 41.0)) * 60.0;
      col += (hash(g) - 0.5) * 0.02;

      float d = length(c * vec2(aspect * 0.6, 1.0));
      float vr = 0.96 - clamp(uVelocity * 1.4, 0.0, 0.25);
      col *= smoothstep(vr, vr - 0.55, d) * 0.88 + 0.12;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};

export class BalloonFlightEngine {
  private container: HTMLElement;
  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer?: EffectComposer;
  private bloomPass?: UnrealBloomPass;
  private gradePass?: ShaderPass;

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
    this.idleSpeed = reduced ? 0.3 : 1.6;

    const { width, height } = this.size();
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 500);

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    } catch {
      onLoaded?.();
      return;
    }

    this.renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.75));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0xf6effa);

    this.initBalloons(320);
    this.initCloudSea(450);
    this.initThermalSparks(500);
    this.initPost();
    this.initEvents();

    this.startTime = performance.now() * 0.001;
    this.lastTime = this.startTime;
    this.animate();
    onLoaded?.();
  }

  private size() {
    return {
      width: this.container.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 800),
      height: this.container.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 600),
    };
  }

  private projScale() {
    const h = this.renderer ? this.renderer.getDrawingBufferSize(new THREE.Vector2()).y : 900;
    return h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
  }

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
      pattern: "striped" | "chevron"
    ) => {
      const topY = cy - 130;
      const envelopeRadius = 120;
      const skirtY = cy + 55;
      const basketY = cy + 150;

      // 1. Aerodynamic Teardrop Envelope
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 38, skirtY);
      ctx.bezierCurveTo(cx - 75, cy + 20, cx - envelopeRadius, cy - 40, cx - envelopeRadius, topY + 40);
      ctx.bezierCurveTo(cx - envelopeRadius, topY - envelopeRadius * 0.6, cx + envelopeRadius, topY - envelopeRadius * 0.6, cx + envelopeRadius, topY + 40);
      ctx.bezierCurveTo(cx + envelopeRadius, cy - 40, cx + 75, cy + 20, cx + 38, skirtY);
      ctx.closePath();
      ctx.clip();

      const numGores = 14;
      for (let g = 0; g < numGores; g++) {
        const t0 = g / numGores;
        const t1 = (g + 1) / numGores;
        const color = colors[g % colors.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        const gx0 = cx - envelopeRadius + t0 * (envelopeRadius * 2);
        const gx1 = cx - envelopeRadius + t1 * (envelopeRadius * 2);
        ctx.rect(gx0, topY - 100, gx1 - gx0, 300);
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
      const grad = ctx.createRadialGradient(cx - 40, topY - 10, 20, cx, cy, envelopeRadius * 1.25);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      grad.addColorStop(0.55, "rgba(255, 255, 255, 0.0)");
      grad.addColorStop(1, "rgba(30, 15, 45, 0.45)");
      ctx.fillStyle = grad;
      ctx.fillRect(cx - envelopeRadius, topY - 100, envelopeRadius * 2, 300);
      ctx.restore();

      // 2. Suspension Rigging
      ctx.strokeStyle = "rgba(70, 50, 60, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 30, skirtY);
      ctx.lineTo(cx - 16, basketY);
      ctx.moveTo(cx + 30, skirtY);
      ctx.lineTo(cx + 16, basketY);
      ctx.moveTo(cx - 15, skirtY);
      ctx.lineTo(cx - 12, basketY);
      ctx.moveTo(cx + 15, skirtY);
      ctx.lineTo(cx + 12, basketY);
      ctx.stroke();

      // 3. Glowing Propane Flame
      const burnerGrad = ctx.createRadialGradient(cx, skirtY + 22, 2, cx, skirtY + 22, 24);
      burnerGrad.addColorStop(0, "rgba(255, 255, 220, 1.0)");
      burnerGrad.addColorStop(0.4, "rgba(255, 170, 40, 0.85)");
      burnerGrad.addColorStop(1, "rgba(255, 70, 0, 0.0)");
      ctx.fillStyle = burnerGrad;
      ctx.beginPath();
      ctx.arc(cx, skirtY + 22, 24, 0, TAU);
      ctx.fill();

      // 4. Wicker Basket
      ctx.fillStyle = "#8d5b38";
      ctx.beginPath();
      ctx.roundRect(cx - 20, basketY, 40, 28, 4);
      ctx.fill();
      ctx.fillStyle = "#633c20";
      ctx.fillRect(cx - 18, basketY + 6, 36, 4);
      ctx.fillRect(cx - 18, basketY + 16, 36, 4);
    };

    // Balloon 0: ArcPay Signature Lavender & Ivory
    drawTile(0, (cx, cy) => renderBalloon(cx, cy, ["#7c5cfc", "#f3eeff", "#9e86fd", "#e0d3ff"], "striped"));

    // Balloon 1: Sunrise Coral, Crimson & Gold
    drawTile(1, (cx, cy) => renderBalloon(cx, cy, ["#ff4d6d", "#ffb703", "#fb8500", "#fff1e6"], "chevron"));

    // Balloon 2: Aegean Cyan, Ocean Blue & White
    drawTile(2, (cx, cy) => renderBalloon(cx, cy, ["#00b4d8", "#0077b6", "#caf0f8", "#023e8a"], "striped"));

    // Balloon 3: Emerald Mint & Forest Gold
    drawTile(3, (cx, cy) => renderBalloon(cx, cy, ["#2ec4b6", "#cbf3f0", "#ffbf69", "#ffffff"], "chevron"));

    // Balloon 4: Royal Midnight Plum & Star Yellow
    drawTile(4, (cx, cy) => renderBalloon(cx, cy, ["#3a0ca3", "#7209b7", "#f72585", "#ffd166"], "striped"));

    // Balloon 5: Rainbow Festival Gores
    drawTile(5, (cx, cy) => renderBalloon(cx, cy, ["#e63946", "#f1a208", "#06d6a0", "#118ab2", "#8338ec"], "striped"));

    // Clouds
    const drawCloud = (cx: number, cy: number, tint: string) => {
      ctx.fillStyle = tint;
      for (const [ox, oy, r] of [
        [-60, 20, 75],
        [60, 25, 70],
        [0, -10, 95],
        [-110, 45, 55],
        [110, 45, 55],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, r, 0, TAU);
        ctx.fill();
      }
    };
    drawTile(6, (cx, cy) => drawCloud(cx, cy, "rgba(255, 245, 250, 0.88)"));
    drawTile(7, (cx, cy) => drawCloud(cx, cy, "rgba(240, 235, 255, 0.75)"));

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  private initBalloons(count: number) {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const kind = new Float32Array(count);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * W * 1.2;
      pos[i3 + 1] = 6 + Math.random() * 32;
      pos[i3 + 2] = Math.random() * D;

      size[i] = 1.6 + Math.pow(Math.random(), 1.5) * 2.2;
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

          float x0 = uCam.x - W * 0.5;
          float z0 = uCam.y - ${AHEAD.toFixed(1)};
          p.x = x0 + mod(position.x - x0, W);
          p.z = z0 + mod(position.z - z0, D);

          float bob = sin(uTime * 0.8 + seed * 25.0) * 0.9;
          float sway = sin(uTime * 0.5 + seed * 12.0) * 0.5;
          p.y += bob;
          p.x += sway;

          float boost = uBurner * (2.5 + seed * 6.0);
          p.y += boost;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = -mv.z;

          vec4 clip = projectionMatrix * mv;
          vec2 ndc = clip.xy / clip.w;
          float md = length(ndc - uCursor);
          vGlow = smoothstep(0.28, 0.0, md);

          gl_PointSize = clamp(size * uProj / max(dist, 0.8), 0.0, 360.0);
          gl_Position = clip;

          vFog = exp(-pow(max(dist - 8.0, 0.0) / 48.0, 2.0));
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
          vec4 tex = texture2D(uAtlas, uv);
          if (tex.a < 0.2) discard;

          vec3 col = tex.rgb;
          vec3 burnerGlow = vec3(1.0, 0.65, 0.3) * uBurner * 0.85;
          col += burnerGlow + vec3(1.0, 0.9, 0.7) * vGlow * 0.25;

          vec3 skyFog = vec3(0.96, 0.92, 0.98);
          col = mix(skyFog, col, vFog);

          gl_FragColor = vec4(col, tex.a * vFog);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const fleet = new THREE.Points(this.balloonGeometry, this.balloonMaterial);
    fleet.frustumCulled = false;
    this.scene.add(fleet);
  }

  private initCloudSea(count: number) {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * W * 1.5;
      pos[i3 + 1] = -2 + Math.random() * 5;
      pos[i3 + 2] = Math.random() * D;
      size[i] = 12 + Math.random() * 18;
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
          p.x = x0 + mod(position.x - x0 + sin(uTime * 0.1) * 3.0, W);
          p.z = z0 + mod(position.z - z0, D);
          p.y += sin(uTime * 0.3 + p.x * 0.05) * 0.6;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = -mv.z;
          gl_PointSize = clamp(size * uProj / dist, 0.0, 420.0);
          gl_Position = projectionMatrix * mv;
          vAlpha = exp(-pow(dist / 65.0, 2.0)) * 0.45;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas;
        varying float vAlpha;
        void main() {
          vec2 uv = (vec2(2.0, 1.0) + gl_PointCoord) / vec2(4.0, 2.0);
          vec4 tex = texture2D(uAtlas, uv);
          gl_FragColor = vec4(vec3(0.98, 0.95, 1.0) * tex.rgb, tex.a * vAlpha);
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

  private initThermalSparks(count: number) {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * W;
      pos[i * 3 + 1] = Math.random() * 40;
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
          gl_PointSize = clamp((0.08 + seed * 0.08) * uProj / dist, 1.0, 10.0);
          gl_Position = projectionMatrix * mv;
          vAlpha = (0.5 + 0.5 * sin(uTime * 3.0 + seed * 40.0)) * exp(-pow(dist / 50.0, 2.0));
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(vec3(1.0, 0.85, 0.55), a);
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
    if (!this.renderer) return;
    const { width, height } = this.size();
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.5, 0.4, 0.7);
    this.composer.addPass(this.bloomPass);
    this.gradePass = new ShaderPass(BalloonPostShader);
    this.composer.addPass(this.gradePass);
    this.composer.addPass(new OutputPass());
    this.updatePostSize();
  }

  private updatePostSize() {
    if (!this.renderer || !this.gradePass) return;
    const buf = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.gradePass.uniforms.uResolution.value.copy(buf);
    this.gradePass.uniforms.uBlur.value = 10 * this.renderer.getPixelRatio();
    if (this.balloonMaterial) {
      this.balloonMaterial.uniforms.uProj.value = this.projScale();
    }
  }

  private initEvents() {
    const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void) => {
      window.addEventListener(type, fn, { passive: true });
      this.removeListeners.push(() => window.removeEventListener(type, fn));
    };

    on("wheel", (e) => {
      this.velocity += e.deltaY * 0.015;
    });

    on("pointermove", (e) => {
      const r = this.container.getBoundingClientRect();
      const x = ((e.clientX - r.left) / (r.width || 1)) * 2 - 1;
      const y = -((e.clientY - r.top) / (r.height || 1)) * 2 + 1;
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
    this.updatePostSize();
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
    const speed = this.idleSpeed + this.velocity + this.burnerProgress * 1.5;

    this.camZ -= speed * dt;
    if (this.camZ < -D) this.camZ += D;
    if (this.camZ > 0) this.camZ -= D;

    this.mouse.lerp(this.targetMouse, Math.min(dt * 3.2, 1));

    const cz = this.camZ;
    const cx = pathX(cz) + this.mouse.x * 3.5;
    const cy = 16 + this.mouse.y * 3.0 + this.burnerProgress * 4.0;
    const lookZ = cz - 24;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(pathX(lookZ) + this.mouse.x * 6.0, cy - 1.5 + this.mouse.y * 4.0, lookZ);
    this.camera.rotateZ(-this.mouse.x * 0.04);

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
    if (this.gradePass) {
      this.gradePass.uniforms.uTime.value = t;
      this.gradePass.uniforms.uVelocity.value = Math.min(Math.abs(this.velocity) / 30, 1);
    }
    if (this.bloomPass) {
      this.bloomPass.strength = 0.5 + this.burnerProgress * 0.45;
    }

    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
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
    this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.35, now + 1.0);
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
