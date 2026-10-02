import * as THREE from "three";
import { mulberry32 } from "@/lib/math";

/**
 * Finishes of the Kaliber 01, as materials:
 *  frosted German silver (bridges), perlage (plate), hand-bevelled polish
 *  (anglage), frosted silver wheels, black-polished steel, heat-blued screws,
 *  rubies in gold chatons. Gold appears on the chatons and the balance screws
 *  and nowhere else. All textures are procedural; nothing is downloaded.
 */

function frostTexture(size = 256, seed = 7) {
  const rnd = mulberry32(seed);
  const data = new Uint8Array(size * size * 4);
  // two octaves of value noise plus per-pixel sparkle = sand-blasted frost
  const grid = (cells: number) => {
    const g = new Float32Array((cells + 1) * (cells + 1));
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    return (x: number, y: number) => {
      const gx = (x / size) * cells;
      const gy = (y / size) * cells;
      const x0 = Math.floor(gx) % cells;
      const y0 = Math.floor(gy) % cells;
      const fx = gx - Math.floor(gx);
      const fy = gy - Math.floor(gy);
      const x1 = (x0 + 1) % cells;
      const y1 = (y0 + 1) % cells;
      const w = cells + 1;
      const a = g[y0 * w + x0];
      const b = g[y0 * w + x1];
      const c = g[y1 * w + x0];
      const d = g[y1 * w + x1];
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  };
  const n1 = grid(32);
  const n2 = grid(96);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = 0.35 * n1(x, y) + 0.35 * n2(x, y) + 0.3 * rnd();
      const c = Math.round(v * 255);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = c;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/** Perlage: overlapping circular graining, the plate's finish */
function perlageTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  const step = size / 8;
  const r = step * 0.78;
  const rnd = mulberry32(11);
  for (let row = -1; row <= 9; row++) {
    for (let col = -1; col <= 9; col++) {
      const cx = col * step + (row % 2 ? step / 2 : 0);
      const cy = row * step * 0.86;
      for (let k = 0; k < 2; k++) {
        const ox = k === 0 ? 0 : size;
        const draw = (x: number, y: number) => {
          for (let ring = 0; ring < 22; ring++) {
            const rr = r * (1 - ring / 22);
            ctx.beginPath();
            ctx.arc(x, y, rr, 0, Math.PI * 2);
            const l = 96 + Math.round(rnd() * 90);
            ctx.strokeStyle = `rgb(${l},${l},${l})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, "rgba(255,255,255,0.18)");
          g.addColorStop(0.75, "rgba(255,255,255,0)");
          g.addColorStop(1, "rgba(0,0,0,0.25)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        };
        if (k === 0) draw(cx, cy);
        else if (cx < step) draw(cx + ox, cy);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Sunburst brushing for the ratchet wheel, radial around the texture center */
function sunburstTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(0, 0, size, size);
  const rnd = mulberry32(5);
  ctx.translate(size / 2, size / 2);
  for (let i = 0; i < 1400; i++) {
    const a = rnd() * Math.PI * 2;
    const l = 70 + Math.round(rnd() * 120);
    ctx.strokeStyle = `rgba(${l},${l},${l},0.55)`;
    ctx.lineWidth = 0.8 + rnd() * 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
    ctx.lineTo(Math.cos(a) * size * 0.72, Math.sin(a) * size * 0.72);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export type Materials = ReturnType<typeof createMaterials>;

export function createMaterials() {
  const frostTex = frostTexture(256, 7);
  // cap UVs are millimetres: one tile is 1.6 mm, grain well under a tenth of a millimetre
  frostTex.repeat.set(0.62, 0.62);
  frostTex.anisotropy = 4;
  const fineFrost = frostTex.clone();
  fineFrost.repeat.set(1.4, 1.4);
  fineFrost.needsUpdate = true;
  // the dial's UVs run 0..1 across its 31.4 mm, so it needs its own scale
  const dialFrost = frostTexture(256, 19);
  dialFrost.repeat.set(18, 18);
  dialFrost.anisotropy = 8;

  const perlage = perlageTexture();
  perlage.repeat.set(0.16, 0.16);

  const sunburst = sunburstTexture();
  // ExtrudeGeometry cap UVs are shape coordinates in mm; map the ratchet's 8 mm disc onto the texture
  sunburst.repeat.set(1 / 8.4, 1 / 8.4);
  sunburst.offset.set(0.5, 0.5);

  const frost = new THREE.MeshStandardMaterial({
    name: "frosted-german-silver",
    color: new THREE.Color("#d9d5cb"),
    metalness: 1,
    roughness: 0.44,
    bumpMap: frostTex,
    bumpScale: 0.32,
  });

  const anglage = new THREE.MeshStandardMaterial({
    name: "anglage",
    color: new THREE.Color("#ece9e2"),
    metalness: 1,
    roughness: 0.07,
  });

  const plate = new THREE.MeshStandardMaterial({
    name: "perlage",
    color: new THREE.Color("#cfcabe"),
    metalness: 1,
    roughness: 0.38,
    roughnessMap: perlage,
    bumpMap: perlage,
    bumpScale: 1.1,
  });

  // the train: the same German silver as the bridges, a finer frost, a touch brighter
  const wheel = new THREE.MeshStandardMaterial({
    name: "wheel-silver",
    color: new THREE.Color("#e1ded7"),
    metalness: 1,
    roughness: 0.3,
    bumpMap: fineFrost,
    bumpScale: 0.22,
  });

  const wheelEdge = new THREE.MeshStandardMaterial({
    name: "wheel-edge",
    color: new THREE.Color("#ecebe7"),
    metalness: 1,
    roughness: 0.1,
  });

  const steel = new THREE.MeshStandardMaterial({
    name: "steel",
    color: new THREE.Color("#d3d6da"),
    metalness: 1,
    roughness: 0.14,
  });

  const sunburstSteel = new THREE.MeshStandardMaterial({
    name: "soleil-steel",
    color: new THREE.Color("#c9ccd1"),
    metalness: 1,
    roughness: 0.26,
    roughnessMap: sunburst,
    bumpMap: sunburst,
    bumpScale: 0.5,
  });

  // a mirror: it reads black from the dark room it reflects (see PolishEnv)
  const blackPolish = new THREE.MeshStandardMaterial({
    name: "black-polish",
    color: new THREE.Color("#c4c7cc"),
    metalness: 1,
    roughness: 0.03,
  });

  // the colour is an oxide film at ~290 °C: deep cornflower, a little
  // thin-film shift at grazing angles, never lavender
  const blued = new THREE.MeshPhysicalMaterial({
    name: "heat-blued-steel",
    color: new THREE.Color("#173a9c"),
    metalness: 1,
    roughness: 0.24,
    iridescence: 0.22,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [330, 390],
  });

  const ruby = new THREE.MeshPhysicalMaterial({
    name: "ruby",
    color: new THREE.Color("#a3102a"),
    emissive: new THREE.Color("#3a0009"),
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    ior: 1.76,
    specularIntensity: 1,
  });

  const gold = new THREE.MeshStandardMaterial({
    name: "gold",
    color: new THREE.Color("#e2c27e"),
    metalness: 1,
    roughness: 0.16,
  });

  const glucydur = new THREE.MeshStandardMaterial({
    name: "glucydur",
    color: new THREE.Color("#d9b98a"),
    metalness: 1,
    roughness: 0.2,
  });

  const caseSteel = new THREE.MeshStandardMaterial({
    name: "case-steel",
    color: new THREE.Color("#d9dce0"),
    metalness: 1,
    roughness: 0.16,
    side: THREE.DoubleSide,
  });

  const brushedSteel = new THREE.MeshStandardMaterial({
    name: "brushed-steel",
    color: new THREE.Color("#cfd2d6"),
    metalness: 1,
    roughness: 0.34,
  });

  const dial = new THREE.MeshStandardMaterial({
    name: "dial-frost",
    color: new THREE.Color("#e4e1da"),
    metalness: 0.85,
    roughness: 0.48,
    bumpMap: dialFrost,
    bumpScale: 0.18,
  });

  const whiteGold = new THREE.MeshStandardMaterial({
    name: "white-gold",
    color: new THREE.Color("#eef0f2"),
    metalness: 1,
    roughness: 0.08,
  });

  const lacquer = new THREE.MeshStandardMaterial({
    name: "lacquer",
    color: new THREE.Color("#121316"),
    metalness: 0,
    roughness: 0.4,
  });

  const sapphire = new THREE.MeshPhysicalMaterial({
    name: "sapphire",
    color: new THREE.Color("#ffffff"),
    metalness: 0,
    roughness: 0,
    transparent: true,
    opacity: 0.08,
    clearcoat: 1,
    depthWrite: false,
  });

  return {
    frost,
    anglage,
    plate,
    wheel,
    wheelEdge,
    steel,
    sunburstSteel,
    blackPolish,
    blued,
    ruby,
    gold,
    glucydur,
    caseSteel,
    brushedSteel,
    dial,
    whiteGold,
    lacquer,
    sapphire,
  };
}
