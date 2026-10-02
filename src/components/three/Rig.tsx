"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sceneProgress, story, type SceneId } from "@/lib/story";
import { clamp, damp, easeInOutCubic, easeInOutQuint, easeOutCubic, invLerp, lerp, smoothstep } from "@/lib/math";
import { movementState } from "./Movement";

/**
 * Camera language: slow to start, long to settle. Each scene owns one move.
 * Keyframes are spherical around a target: az swings around +z, el lifts
 * from the bench plane, upY blends screen-up from 12 o'clock (+y) to the
 * stack axis (+z) so the exploded movement stands as a tower.
 */
type Key = { t: [number, number, number] | "display"; r: number; az: number; el: number; upY: number; fov: number };

const deg = Math.PI / 180;
const easeInQuad = (t: number) => t * t;

const DESKTOP: Record<string, Key> = {
  // the watch sits low and right, cropped by the bottom and right edges
  tick0: { t: [-18.2, 5.8, 0], r: 76, az: 4, el: 84, upY: 1, fov: 30 },
  tick1: { t: [-16.7, 7.8, 0], r: 71, az: 7, el: 80, upY: 1, fov: 30 },
  // mid-flip the case swings toward the lens; step back so it stays under the bar
  turnMid: { t: [-15, 11, 1.5], r: 96, az: 8, el: 70, upY: 0.6, fov: 30 },
  turn1: { t: [-12.5, 1.5, 3], r: 70, az: 8, el: 57, upY: 0, fov: 30 },
  apart1: { t: [2.6, -0.9, 27], r: 142, az: -24, el: 27, upY: 0, fov: 30 },
  once0: { t: "display", r: 30, az: -14, el: 36, upY: 0, fov: 30 },
  once1: { t: "display", r: 23, az: 22, el: 60, upY: 0, fov: 30 },
  againMid: { t: [-13, 2, 3], r: 80, az: -6, el: 48, upY: 0, fov: 30 },
  againEnd: { t: [-5, 1.5, 0], r: 96, az: 3, el: 86, upY: 1, fov: 30 },
  night: { t: [-1.5, -1.5, 0], r: 112, az: 2, el: 88, upY: 1, fov: 30 },
  request: { t: [28, 4, 0], r: 128, az: 0, el: 89, upY: 1, fov: 30 },
};

const MOBILE: Record<string, Key> = {
  // at loupe scale, bleeding off the right edge; the headline passes behind its lower rim
  tick0: { t: [-12.1, -10.5, 0], r: 132, az: 3, el: 85, upY: 1, fov: 32 },
  tick1: { t: [-11.6, -10, 0], r: 126, az: 5, el: 82, upY: 1, fov: 32 },
  turnMid: { t: [0, -9, 1], r: 180, az: 5.5, el: 75, upY: 0.6, fov: 32 },
  turn1: { t: [0, -4, 3], r: 150, az: 6, el: 60, upY: 0, fov: 32 },
  apart1: { t: [3, 0, 28], r: 250, az: -24, el: 12, upY: 0, fov: 32 },
  once0: { t: "display", r: 56, az: -12, el: 30, upY: 0, fov: 32 },
  once1: { t: "display", r: 46, az: 22, el: 52, upY: 0, fov: 32 },
  againMid: { t: [0, 0, 3], r: 170, az: -6, el: 50, upY: 0, fov: 32 },
  againEnd: { t: [0, -10, 0], r: 200, az: 3, el: 86, upY: 1, fov: 32 },
  night: { t: [0, -18, 0], r: 250, az: 2, el: 88, upY: 1, fov: 32 },
  // above the request's title, in the space the layout leaves for it
  request: { t: [0, -38, 0], r: 260, az: 0, el: 89, upY: 1, fov: 32 },
};

type Seg = { from: string; to: string; a: number; b: number; ease?: (t: number) => number };

const SEGMENTS: Record<Exclude<SceneId, never>, Seg[]> = {
  tick: [{ from: "tick0", to: "tick1", a: 0, b: 1 }],
  turn: [
    { from: "tick1", to: "turnMid", a: 0.0, b: 0.34, ease: easeInQuad },
    { from: "turnMid", to: "turn1", a: 0.34, b: 0.92, ease: easeOutCubic },
  ],
  apart: [{ from: "turn1", to: "apart1", a: 0, b: 0.92 }],
  once: [
    { from: "apart1", to: "once0", a: 0, b: 0.24, ease: easeInOutQuint },
    { from: "once0", to: "once1", a: 0.24, b: 0.86 },
    { from: "once1", to: "againMid", a: 0.86, b: 1.0, ease: easeInOutQuint },
  ],
  again: [
    { from: "againMid", to: "againMid", a: 0, b: 0.5 },
    { from: "againMid", to: "againEnd", a: 0.5, b: 1, ease: easeInOutQuint },
  ],
  night: [{ from: "againEnd", to: "night", a: 0, b: 0.55 }],
  request: [{ from: "night", to: "request", a: 0, b: 1 }],
};

// on a phone the screws reach their ring above the stack early; the camera
// steps back first and settles long, so the ring never rides up under the words
const MOBILE_SEGMENTS: Partial<Record<SceneId, Seg[]>> = {
  apart: [{ from: "turn1", to: "apart1", a: 0, b: 0.6, ease: easeOutCubic }],
};

const ORDER: SceneId[] = ["tick", "turn", "apart", "once", "again", "night", "request"];

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function resolveTarget(k: Key, out: THREE.Vector3) {
  if (k.t === "display") return out.copy(movementState.displayPoint);
  return out.set(k.t[0], k.t[1], k.t[2]);
}

function sample(k1: Key, k2: Key, t: number, target: THREE.Vector3, pos: THREE.Vector3, up: THREE.Vector3) {
  resolveTarget(k1, tmpA);
  resolveTarget(k2, tmpB);
  target.lerpVectors(tmpA, tmpB, t);
  const r = lerp(k1.r, k2.r, t);
  const az = lerp(k1.az, k2.az, t) * deg;
  const el = lerp(k1.el, k2.el, t) * deg;
  pos.set(Math.cos(el) * Math.sin(az) * r, -Math.cos(el) * Math.cos(az) * r, Math.sin(el) * r).add(target);
  const upY = lerp(k1.upY, k2.upY, t);
  up.set(0, upY, 1 - upY).normalize();
  return lerp(k1.fov, k2.fov, t);
}

export function Rig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const cur = useRef<{ target: THREE.Vector3; pos: THREE.Vector3; up: THREE.Vector3; init: boolean }>({
    target: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
    init: false,
  });
  const goal = useMemo(
    () => ({ target: new THREE.Vector3(), pos: new THREE.Vector3(), up: new THREE.Vector3() }),
    [],
  );
  const proj = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const keys = story.mobile ? MOBILE : DESKTOP;

    let active: SceneId = "tick";
    for (let i = ORDER.length - 1; i >= 0; i--) {
      if (story.progress[ORDER[i]] > 0) {
        active = ORDER[i];
        break;
      }
    }
    const p = sceneProgress(active);
    const segs = (story.mobile && MOBILE_SEGMENTS[active]) || SEGMENTS[active];
    let seg = segs[0];
    for (const s of segs) if (p >= s.a) seg = s;
    const local = (seg.ease ?? easeInOutCubic)(invLerp(seg.a, seg.b, p));
    const fov = sample(keys[seg.from], keys[seg.to], local, goal.target, goal.pos, goal.up);

    // on short screens the fixed bar takes more of the height: the opening
    // frames sit a little lower, until the turn swings the watch away from it
    if (!story.mobile) {
      const w = active === "tick" ? 1 : active === "turn" ? 1 - smoothstep(0, 0.34, p) : 0;
      const lower = clamp((880 - size.height) / 160) * 1.1 * w;
      goal.target.y += lower;
      goal.pos.y += lower;
    }

    // a low-amplitude lean toward the cursor
    if (story.pointer.fine && !story.reduced) {
      const k = goal.pos.distanceTo(goal.target) / 80;
      goal.pos.x += story.pointer.nx * 1.4 * k;
      goal.pos.y += -story.pointer.ny * 1.0 * k;
    }

    const c = cur.current;
    if (!c.init || story.reduced) {
      c.target.copy(goal.target);
      c.pos.copy(goal.pos);
      c.up.copy(goal.up);
      c.init = true;
    } else {
      const k = damp(4.2, dt);
      c.target.lerp(goal.target, k);
      c.pos.lerp(goal.pos, k);
      c.up.lerp(goal.up, k).normalize();
    }
    camera.position.copy(c.pos);
    camera.up.copy(c.up);
    camera.lookAt(c.target);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // tell the DOM where the watch and the remontoir are on screen
    proj.set(0, 0, 0).project(camera);
    const cx = (proj.x + 1) / 2;
    const cy = (1 - proj.y) / 2;
    proj.set(19.6, 0, 0).project(camera);
    const ex = (proj.x + 1) / 2;
    const ey = (1 - proj.y) / 2;
    const rr = Math.hypot((ex - cx) * size.width, (ey - cy) * size.height) / Math.max(1, size.height);
    story.lamp.x = cx;
    story.lamp.y = cy;
    story.lamp.r = rr;
    proj.copy(movementState.displayPoint).project(camera);
    story.temperOrigin.x = (proj.x + 1) / 2;
    story.temperOrigin.y = (1 - proj.y) / 2;
  });

  return null;
}
