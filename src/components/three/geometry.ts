import * as THREE from "three";

type V2 = [number, number];
export type Circle = [x: number, y: number, r: number];

/** Andrew's monotone chain */
function convexHull(points: V2[]): V2[] {
  const pts = points.slice().sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  const cross = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: V2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: V2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * A bridge outline: the convex hull of the bearing circles it has to cover.
 * Arcs and tangents, the way bridges are actually drawn.
 */
export function bridgeShape(circles: Circle[], origin: V2 = [0, 0], holes: Circle[] = []) {
  const pts: V2[] = [];
  for (const [x, y, r] of circles) {
    const n = Math.max(28, Math.round(r * 22));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([x - origin[0] + Math.cos(a) * r, y - origin[1] + Math.sin(a) * r]);
    }
  }
  const hull = convexHull(pts);
  const shape = new THREE.Shape(hull.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const [x, y, r] of holes) {
    const h = new THREE.Path();
    h.absarc(x - origin[0], y - origin[1], r, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  return shape;
}

type GearOpts = {
  r: number;
  teeth: number;
  depth?: number;
  spokes?: number;
  rim?: number;
  hub?: number;
  spokeWidth?: number;
  hole?: number;
  tip?: number;
  base?: number;
};

/** A wheel: trapezoid teeth, a rim, and curved-corner crossings between spokes */
export function gearShape({
  r,
  teeth,
  depth = r * 0.06,
  spokes = 5,
  rim = r * 0.12,
  hub = r * 0.2,
  spokeWidth = r * 0.075,
  hole = 0.18,
  tip = 0.36,
  base = 0.56,
}: GearOpts) {
  const pitch = (Math.PI * 2) / teeth;
  const rRoot = r - depth;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    const bh = (pitch * base) / 2;
    const th = (pitch * tip) / 2;
    pts.push(new THREE.Vector2(Math.cos(a - bh) * rRoot, Math.sin(a - bh) * rRoot));
    pts.push(new THREE.Vector2(Math.cos(a - th) * r, Math.sin(a - th) * r));
    pts.push(new THREE.Vector2(Math.cos(a + th) * r, Math.sin(a + th) * r));
    pts.push(new THREE.Vector2(Math.cos(a + bh) * rRoot, Math.sin(a + bh) * rRoot));
  }
  const shape = new THREE.Shape(pts);

  if (spokes > 0) {
    const rIn = rRoot - rim;
    const rHub = hub;
    if (rIn > rHub + 0.15) {
      const step = (Math.PI * 2) / spokes;
      for (let k = 0; k < spokes; k++) {
        const a0 = k * step + Math.PI / 2;
        const a1 = a0 + step;
        const ho = Math.asin(Math.min(0.95, spokeWidth / 2 / rIn));
        const hi = Math.asin(Math.min(0.95, spokeWidth / 2 / rHub));
        const p = new THREE.Path();
        p.absarc(0, 0, rIn, a0 + ho, a1 - ho, false);
        p.absarc(0, 0, rHub, a1 - hi, a0 + hi, true);
        p.closePath();
        shape.holes.push(p);
      }
    }
  }
  if (hole > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, hole, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  return shape;
}

/** Club-tooth escape wheel: raked sawtooth with a flat impulse face */
export function escapeWheelShape(r: number, teeth = 20) {
  const pitch = (Math.PI * 2) / teeth;
  const rRoot = r * 0.74;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    pts.push(new THREE.Vector2(Math.cos(a) * rRoot, Math.sin(a) * rRoot));
    pts.push(new THREE.Vector2(Math.cos(a + pitch * 0.42) * r, Math.sin(a + pitch * 0.42) * r));
    pts.push(new THREE.Vector2(Math.cos(a + pitch * 0.58) * r * 0.985, Math.sin(a + pitch * 0.58) * r * 0.985));
    pts.push(new THREE.Vector2(Math.cos(a + pitch * 0.66) * rRoot * 1.02, Math.sin(a + pitch * 0.66) * rRoot * 1.02));
  }
  const shape = new THREE.Shape(pts);
  const spokes = 4;
  const step = (Math.PI * 2) / spokes;
  const rIn = rRoot * 0.78;
  const rHub = r * 0.2;
  for (let k = 0; k < spokes; k++) {
    const a0 = k * step;
    const p = new THREE.Path();
    p.absarc(0, 0, rIn, a0 + 0.22, a0 + step - 0.22, false);
    p.absarc(0, 0, rHub, a0 + step - 0.6, a0 + 0.6, true);
    p.closePath();
    shape.holes.push(p);
  }
  return shape;
}

/** The remontoir's stop star */
export function starShape(r: number, points = 6, inner = 0.42) {
  const pts: THREE.Vector2[] = [];
  const n = points * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
  }
  const shape = new THREE.Shape(pts);
  const h = new THREE.Path();
  h.absarc(0, 0, r * 0.14, 0, Math.PI * 2, true);
  shape.holes.push(h);
  return shape;
}

export function annulusShape(ro: number, ri: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, ro, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  h.absarc(0, 0, ri, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}

export function discShape(r: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}

/** Balance wheel: rim, two arms, hub */
export function balanceShape(r: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  const ri = r * 0.84;
  const armW = r * 0.09;
  const hub = r * 0.16;
  for (const a0 of [0, Math.PI]) {
    const ho = Math.asin(armW / 2 / ri);
    const hi = Math.asin(Math.min(0.95, armW / 2 / hub));
    const p = new THREE.Path();
    p.absarc(0, 0, ri, a0 + ho, a0 + Math.PI - ho, false);
    p.absarc(0, 0, hub, a0 + Math.PI - hi, a0 + hi, true);
    p.closePath();
    s.holes.push(p);
  }
  return s;
}

/** Pallet fork: an anchor with two arms and a fork toward the balance */
export function palletShape() {
  const s = new THREE.Shape();
  // Drawn with the pivot at origin; +x toward the escape wheel, -x toward the balance.
  s.moveTo(-3.1, 0.22);
  s.lineTo(-0.7, 0.26);
  s.quadraticCurveTo(0.2, 0.4, 0.9, 1.15);
  s.lineTo(1.9, 1.55);
  s.quadraticCurveTo(2.25, 1.55, 2.2, 1.2);
  s.lineTo(1.25, 0.75);
  s.quadraticCurveTo(0.95, 0.2, 1.25, -0.45);
  s.lineTo(2.25, -1.05);
  s.quadraticCurveTo(2.35, -1.45, 1.95, -1.5);
  s.lineTo(0.85, -1.05);
  s.quadraticCurveTo(0.2, -0.4, -0.7, -0.26);
  s.lineTo(-3.1, -0.22);
  s.lineTo(-3.55, -0.42);
  s.lineTo(-3.55, 0.42);
  s.closePath();
  const h = new THREE.Path();
  h.absarc(0, 0, 0.16, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}

/** Detent lever for the remontoir: a long tapered arm */
export function detentShape(len: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0.42);
  s.quadraticCurveTo(len * 0.5, 0.3, len, 0.12);
  s.lineTo(len + 0.35, 0);
  s.lineTo(len, -0.12);
  s.quadraticCurveTo(len * 0.5, -0.3, 0, -0.42);
  s.absarc(0, 0, 0.42, -Math.PI / 2, Math.PI / 2, true);
  const h = new THREE.Path();
  h.absarc(0, 0, 0.14, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}

/** Leaf hand ("feuille") pointing +y */
export function leafHandShape(len: number, width: number, tail = 0) {
  const s = new THREE.Shape();
  const w = width / 2;
  s.moveTo(0, -tail);
  s.quadraticCurveTo(w * 1.1, len * 0.18, w, len * 0.42);
  s.quadraticCurveTo(w * 0.7, len * 0.75, 0, len);
  s.quadraticCurveTo(-w * 0.7, len * 0.75, -w, len * 0.42);
  s.quadraticCurveTo(-w * 1.1, len * 0.18, 0, -tail);
  return s;
}

/** Needle seconds hand with a round counterweight */
export function secondsHandShape(len: number, tail: number) {
  const s = new THREE.Shape();
  s.moveTo(-0.07, 0);
  s.lineTo(-0.035, len);
  s.lineTo(0.035, len);
  s.lineTo(0.07, 0);
  s.lineTo(0.12, -tail + 1.2);
  s.absarc(0, -tail + 0.6, 0.62, Math.PI * 0.35, Math.PI * 0.65 + Math.PI * 2, false);
  s.lineTo(-0.12, -tail + 1.2);
  s.closePath();
  return s;
}

/** Rounded lug outline, extruded along z */
export function lugShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.1, 0);
  s.lineTo(-1.9, 6.4);
  s.quadraticCurveTo(-1.8, 7.6, 0, 7.7);
  s.quadraticCurveTo(1.8, 7.6, 1.9, 6.4);
  s.lineTo(2.1, 0);
  s.closePath();
  return s;
}

export function extrude(shape: THREE.Shape, depth: number, bevel = 0, curveSegments = 24) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, depth - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel * 0.4,
    bevelSegments: bevel > 0 ? 3 : 0,
    curveSegments,
  });
  if (bevel > 0) g.translate(0, 0, bevel);
  g.computeVertexNormals();
  return g;
}

/** Flat Archimedean spiral (hairspring / remontoir spring) */
export function spiralGeometry(r0: number, r1: number, turns: number, wire: number, z = 0) {
  const pts: THREE.Vector3[] = [];
  const n = Math.round(turns * 48);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, n, wire, 4, false);
}

/** Domed screw head (lathe) */
export function screwHeadGeometry(r = 0.55, h = 0.34) {
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0.0001, 0));
  pts.push(new THREE.Vector2(r, 0));
  pts.push(new THREE.Vector2(r, h * 0.45));
  const n = 8;
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * r * 0.98, h * 0.45 + Math.sin(a) * h * 0.55));
  }
  pts.push(new THREE.Vector2(0.0001, h));
  const g = new THREE.LatheGeometry(pts, 28);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Gold chaton: a lathe ring with a rounded top */
export function chatonGeometry(r: number) {
  const pts = [
    new THREE.Vector2(r * 0.5, 0),
    new THREE.Vector2(r, 0),
    new THREE.Vector2(r, r * 0.18),
    new THREE.Vector2(r * 0.94, r * 0.3),
    new THREE.Vector2(r * 0.62, r * 0.32),
    new THREE.Vector2(r * 0.55, r * 0.22),
  ];
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Ruby: a shallow domed cylinder with a pivot hole impression */
export function jewelGeometry(r: number) {
  const pts = [
    new THREE.Vector2(0.06, r * 0.34),
    new THREE.Vector2(r * 0.25, r * 0.36),
    new THREE.Vector2(r * 0.7, r * 0.3),
    new THREE.Vector2(r, r * 0.16),
    new THREE.Vector2(r, 0),
    new THREE.Vector2(0.0001, 0),
  ];
  const g = new THREE.LatheGeometry(pts, 32);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Case profile in (radius, z); dial side is -z */
export function caseGeometry() {
  const p = (r: number, z: number) => new THREE.Vector2(r, z);
  const pts = [
    p(16.25, -2.85),
    p(16.6, -3.35),
    p(17.6, -3.62),
    p(18.9, -3.38),
    p(19.5, -2.6),
    p(19.62, -1.6),
    p(19.62, 3.6),
    p(19.4, 4.7),
    p(18.7, 5.5),
    p(17.6, 5.9),
    p(15.9, 6.05),
    p(15.4, 5.6),
    p(16.2, 1.0),
    p(16.2, -2.85),
  ];
  const g = new THREE.LatheGeometry(pts, 160);
  // lathe height (y) becomes z, so the bezel lands on the dial side (-z)
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}
