"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Materials } from "./materials";
import * as G from "./geometry";
import {
  BRIDGES,
  BRIDGE_T,
  JEWELS,
  P,
  PART,
  PARTS,
  PLATE_R,
  PLATE_T,
  SCREWS,
  type PartId,
} from "./layout";
import { sceneProgress, story } from "@/lib/story";
import { clamp, damp, deadBeat, easeInOutCubic, easeOutCubic, lerp, smoothstep, win } from "@/lib/math";

/** Live objects other modules read (labels, power path, rig). */
export const partObjects = new Map<string, THREE.Object3D>();
export const movementState = Object.assign(story.movement, {
  /** S4: remontoir isolated and demonstrated */
  isolate: 0,
  displayPoint: new THREE.Vector3(),
});

type Geo = ReturnType<typeof buildGeometries>;

function buildGeometries() {
  const bridge = (id: PartId) => {
    const def = PART[id];
    return G.extrude(G.bridgeShape(BRIDGES[id]!, [def.home[0], def.home[1]]), BRIDGE_T, 0.14, 32);
  };
  return {
    plate: G.extrude(G.discShape(PLATE_R), PLATE_T, 0.16, 96),
    barrelTeeth: G.extrude(G.gearShape({ r: 5.8, teeth: 96, depth: 0.28, spokes: 0, hole: 0 }), 0.42, 0.03),
    barrelDrum: new THREE.CylinderGeometry(5.42, 5.42, 1.9, 96, 1, true).rotateX(Math.PI / 2).translate(0, 0, 1.37),
    barrelCover: G.extrude(G.annulusShape(5.42, 0.9), 0.18, 0.04, 96),
    center: G.extrude(G.gearShape({ r: 4.4, teeth: 80, depth: 0.22, spokes: 5 }), 0.22, 0.03),
    third: G.extrude(G.gearShape({ r: 3.5, teeth: 75, depth: 0.19, spokes: 5 }), 0.2, 0.03),
    fourth: G.extrude(G.gearShape({ r: 3.1, teeth: 70, depth: 0.17, spokes: 5 }), 0.2, 0.03),
    remWheel: G.extrude(G.gearShape({ r: 2.7, teeth: 60, depth: 0.15, spokes: 4 }), 0.2, 0.03),
    arbor: new THREE.CylinderGeometry(0.16, 0.16, 3.2, 12).rotateX(Math.PI / 2).translate(0, 0, -0.3),
    pinion: new THREE.CylinderGeometry(0.42, 0.42, 0.7, 12).rotateX(Math.PI / 2).translate(0, 0, -0.45),
    escape: G.extrude(G.escapeWheelShape(2.2, 20), 0.2, 0.02),
    pallet: G.extrude(G.palletShape(), 0.3, 0.04, 16),
    palletStone: new THREE.BoxGeometry(0.5, 0.2, 0.42),
    balance: G.extrude(G.balanceShape(4.4), 0.34, 0.04, 64),
    balanceScrew: new THREE.CylinderGeometry(0.28, 0.28, 0.5, 12),
    hairspring: G.spiralGeometry(0.55, 2.9, 11, 0.028, 0.75),
    staff: new THREE.CylinderGeometry(0.15, 0.15, 3.2, 10).rotateX(Math.PI / 2).translate(0, 0, 0.4),
    roller: G.extrude(G.discShape(0.85), 0.14, 0.02, 32),
    remSpring: G.spiralGeometry(0.32, 2.15, 7, 0.042, 0.02),
    remStar: G.extrude(G.starShape(1.9, 6, 0.36), 0.3, 0.05, 8),
    remDetent: G.extrude(G.detentShape(2.0), 0.22, 0.03, 12),
    ratchet: G.extrude(G.gearShape({ r: 4.0, teeth: 72, depth: 0.2, spokes: 0, hole: 0.5, tip: 0.18, base: 0.82 }), 0.42, 0.05, 72),
    crownWheel: G.extrude(G.gearShape({ r: 1.8, teeth: 36, depth: 0.14, spokes: 0, hole: 0.3 }), 0.36, 0.04),
    barrelBridge: bridge("barrelBridge"),
    trainBridge: bridge("trainBridge"),
    remBridge: bridge("remBridge"),
    palletBridge: bridge("palletBridge"),
    cock: bridge("cock"),
    chaton: {
      0.7: G.chatonGeometry(0.7),
      0.75: G.chatonGeometry(0.75),
      0.8: G.chatonGeometry(0.8),
      0.9: G.chatonGeometry(0.9),
      1.0: G.chatonGeometry(1.0),
      1.25: G.chatonGeometry(1.25),
    } as Record<number, THREE.BufferGeometry>,
    jewel: G.jewelGeometry(1),
    screwHead: G.screwHeadGeometry(0.55, 0.34),
    screwSlot: new THREE.BoxGeometry(1.0, 0.13, 0.14),
  };
}

function Jewels({ id, geo, m }: { id: PartId; geo: Geo; m: Materials }) {
  const list = JEWELS[id];
  if (!list) return null;
  const def = PART[id];
  return (
    <>
      {list.map(([x, y, r], i) => (
        <group key={i} position={[x - def.home[0], y - def.home[1], BRIDGE_T]}>
          <mesh geometry={geo.chaton[r] ?? geo.chaton[0.9]} material={m.gold} castShadow />
          <mesh geometry={geo.jewel} material={m.ruby} scale={[r * 0.52, r * 0.52, r * 0.52]} position={[0, 0, 0.06]} />
        </group>
      ))}
    </>
  );
}

export function Movement({ materials: m }: { materials: Materials }) {
  const geo = useMemo(() => buildGeometries(), []);
  const groups = useRef<Partial<Record<PartId, THREE.Group>>>({});
  const spinners = useRef<Partial<Record<string, THREE.Object3D>>>({});
  const heads = useRef<THREE.InstancedMesh>(null);
  const slots = useRef<THREE.InstancedMesh>(null);

  const sim = useRef({
    mechT: 0,
    run: 1,
    vel: 0,
    lastWhole: 0,
    starCount: 0,
    lastFire: 0,
  });

  const tmp = useMemo(
    () => ({
      obj: new THREE.Object3D(),
      slot: new THREE.Matrix4().makeTranslation(0, 0, 0.3),
      m4: new THREE.Matrix4(),
      v: new THREE.Vector3(),
    }),
    [],
  );

  const setGroup = (id: PartId) => (el: THREE.Group | null) => {
    if (el) {
      groups.current[id] = el;
      partObjects.set(id, el);
    }
  };
  const setSpin = (key: string) => (el: THREE.Object3D | null) => {
    if (el) spinners.current[key] = el;
  };

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const s = sim.current;
    const pA = sceneProgress("apart");
    const pO = sceneProgress("once");
    const pG = sceneProgress("again");

    // scroll velocity stretches the stack a little, then settles
    const targetVel = clamp(story.velocity / 60, -1, 1);
    s.vel = lerp(s.vel, story.reduced ? 0 : targetVel, damp(4, dt));

    const iso = story.reduced
      ? pO > 0 && pO < 1
        ? 1
        : 0
      : easeInOutCubic(smoothstep(0.02, 0.2, pO)) * (1 - easeInOutCubic(smoothstep(0.84, 1, pO)));
    movementState.isolate = iso;

    // display point for the remontoir demonstration
    const star = PART.remStar;
    const D = movementState.displayPoint.set(star.ex[0] - 1.5, star.ex[1] + 1.0, star.ex[2] - 4);

    let apartMax = 0;
    const now = performance.now() / 1000;

    for (const def of PARTS) {
      const g = groups.current[def.id];
      if (!g) continue;
      const e = win(pA, def.out[0], def.out[1], easeInOutCubic);
      const b = win(pG, def.back[0], def.back[1], easeOutCubic);
      const x = e * (1 - b);
      if (def.id === "cock" || def.id === "balance") apartMax = Math.max(apartMax, x);
      const was = movementState.explode[def.id] ?? 0;
      if (was < 0.5 && x >= 0.5) movementState.latest = def.id;
      movementState.explode[def.id] = x;

      const xz = x;
      const xy = Math.pow(x, 1.5);
      let px = lerp(def.home[0], def.ex[0], xy);
      let py = lerp(def.home[1], def.ex[1], xy);
      let pz = lerp(def.home[2], def.ex[2], xz) + s.vel * def.ex[2] * 0.08 * x;

      const breathe = x * (1 - iso);
      let rx = def.exTilt[0] * breathe + Math.sin(now * 0.5 + def.ex[2]) * 0.02 * breathe;
      let ry = def.exTilt[1] * breathe + Math.cos(now * 0.43 + def.ex[2]) * 0.02 * breathe;
      let rz = def.exRot * breathe;

      if (iso > 0) {
        if (def.remontoir) {
          const tx = D.x + (def.home[0] - P.rem[0]);
          const ty = D.y + (def.home[1] - P.rem[1]);
          const tz = D.z + (def.home[2] - star.home[2]) * (def.id === "remWheel" ? 0.9 : 1.6);
          px = lerp(px, tx, iso);
          py = lerp(py, ty, iso);
          pz = lerp(pz, tz, iso);
          rx = lerp(rx, 0, iso);
          ry = lerp(ry, 0, iso);
          rz = lerp(rz, 0, iso);
        } else {
          tmp.v.set(def.ex[0] - D.x, def.ex[1] - D.y, 0);
          if (tmp.v.lengthSq() < 0.01) tmp.v.set(1, 0, 0);
          tmp.v.normalize();
          // far enough that, seen from the close camera, they clear the top of the frame
          const push = iso * iso;
          px += tmp.v.x * 260 * push;
          py += tmp.v.y * 260 * push;
          pz += (def.ex[2] < D.z ? -20 : 40) * push;
        }
      }
      g.position.set(px, py, pz);
      g.rotation.set(rx, ry, rz);
    }

    // The watch runs while assembled; taken apart it winds down, the way a real one would.
    movementState.apart = apartMax;
    const runTarget = 1 - clamp(apartMax * 2.5);
    s.run = lerp(s.run, runTarget, damp(3, dt));
    s.mechT += dt * s.run;

    // Real seconds drive the remontoir: one release per second while it has power.
    const sec = Date.now() / 1000;
    const whole = Math.floor(sec);
    const phase = sec - whole;
    const remActive = s.run > 0.5 || iso > 0.5;
    if (whole !== s.lastWhole) {
      if (remActive) {
        s.starCount += 1;
        movementState.releases += 1;
        s.lastFire = whole;
      }
      s.lastWhole = whole;
    }
    const firing = remActive && s.lastFire === whole;
    const stepped = s.starCount - (firing ? 1 - deadBeat(phase) : 0);

    const sp = spinners.current;
    const TAU = Math.PI * 2;
    // going train advances once a second as the remontoir is rewound
    if (sp.fourth) sp.fourth.rotation.z = -(stepped * TAU) / 60;
    if (sp.third) sp.third.rotation.z = (stepped * TAU) / 60 / 7.5;
    if (sp.center) sp.center.rotation.z = -(stepped * TAU) / 3600;
    if (sp.remWheel) sp.remWheel.rotation.z = (stepped * TAU) / 10;
    if (sp.remStar) sp.remStar.rotation.z = -(stepped * TAU) / 6;
    if (sp.remSpring) {
      // winds through the second, gives it back at the release
      const wound = remActive ? (firing ? 1 - deadBeat(phase, 0.12) : phase) : 0.4;
      sp.remSpring.rotation.z = wound * 0.55;
      sp.remSpring.scale.setScalar(1 - wound * 0.04);
    }
    if (sp.remDetent) {
      const kick = remActive ? Math.max(0, 1 - phase / 0.11) : 0;
      sp.remDetent.rotation.z = Math.sin(kick * Math.PI) * 0.16;
    }
    // escapement: 3 Hz, 6 beats a second
    const amp = 3.5 * s.run;
    const osc = Math.sin(TAU * 3 * s.mechT);
    if (sp.balance) sp.balance.rotation.z = amp * osc;
    if (sp.hairspring) sp.hairspring.scale.setScalar(1 + 0.05 * osc * s.run);
    if (sp.pallet) sp.pallet.rotation.z = Math.tanh(osc * 6) * 0.12 * Math.min(1, s.run * 1.4);
    if (sp.escape) {
      const beats = s.mechT * 6;
      const wb = Math.floor(beats);
      const fb = beats - wb;
      sp.escape.rotation.z = -((wb + Math.min(1, fb / 0.18)) * TAU) / 40;
    }

    // blued screws: unscrew, lift, settle onto the ring above the stack
    const H = heads.current;
    const S = slots.current;
    if (H && S) {
      const o = tmp.obj;
      let out = 0;
      SCREWS.forEach((sc, i) => {
        const e = win(pA, sc.out[0], sc.out[1], easeInOutCubic);
        const b = win(pG, sc.back[0], sc.back[1], easeOutCubic);
        const x = e * (1 - b);
        if (x > 0.5) out += 1;
        if (i === 0) movementState.explode.screws = x;
        const xy = Math.pow(x, 1.6);
        let px = lerp(sc.home[0], sc.ex[0], xy);
        let py = lerp(sc.home[1], sc.ex[1], xy);
        let pz = lerp(sc.home[2], sc.ex[2], x) + s.vel * 4 * x;
        if (iso > 0) {
          tmp.v.set(sc.ex[0] - D.x, sc.ex[1] - D.y, 0).normalize();
          px += tmp.v.x * 150 * iso * iso;
          py += tmp.v.y * 150 * iso * iso;
          pz += 34 * iso * iso;
        }
        o.position.set(px, py, pz);
        const unscrew = clamp(x * 3);
        o.rotation.set(
          Math.sin(i * 1.7) * 0.5 * x,
          Math.cos(i * 1.3) * 0.5 * x,
          i * 0.9 - unscrew * Math.PI * 6 + now * 0.25 * x,
        );
        o.updateMatrix();
        H.setMatrixAt(i, o.matrix);
        tmp.m4.multiplyMatrices(o.matrix, tmp.slot);
        S.setMatrixAt(i, tmp.m4);
      });
      if (movementState.screwsOut < SCREWS.length / 2 && out >= SCREWS.length / 2) movementState.latest = "screws";
      movementState.screwsOut = out;
      H.instanceMatrix.needsUpdate = true;
      S.instanceMatrix.needsUpdate = true;
    }
  });

  const gearMats = [m.wheel, m.wheelEdge];
  const bridgeMats = [m.frost, m.anglage];

  return (
    <group ref={(el) => void (el && partObjects.set("movement", el))}>
      {/* 01 main plate */}
      <group ref={setGroup("plate")}>
        <mesh geometry={geo.plate} material={[m.plate, m.anglage]} receiveShadow castShadow />
      </group>

      {/* 02 barrel */}
      <group ref={setGroup("barrel")}>
        <group ref={setSpin("barrel")}>
          <mesh geometry={geo.barrelTeeth} material={gearMats} castShadow receiveShadow />
          <mesh geometry={geo.barrelDrum} material={m.wheelEdge} castShadow />
          <mesh geometry={geo.barrelCover} material={gearMats} position={[0, 0, 2.3]} castShadow receiveShadow />
          <mesh geometry={geo.arbor} material={m.steel} position={[0, 0, 1.4]} />
        </group>
      </group>

      {(["center", "third", "fourth"] as const).map((id) => (
        <group key={id} ref={setGroup(id)}>
          <group ref={setSpin(id)}>
            <mesh geometry={geo[id]} material={gearMats} castShadow receiveShadow />
            <mesh geometry={geo.pinion} material={m.steel} />
            <mesh geometry={geo.arbor} material={m.steel} />
          </group>
        </group>
      ))}

      <group ref={setGroup("remWheel")}>
        <group ref={setSpin("remWheel")}>
          <mesh geometry={geo.remWheel} material={gearMats} castShadow receiveShadow />
          <mesh geometry={geo.pinion} material={m.steel} />
          <mesh geometry={geo.arbor} material={m.steel} scale={[1, 1, 1.2]} />
        </group>
      </group>

      <group ref={setGroup("escape")}>
        <group ref={setSpin("escape")}>
          <mesh geometry={geo.escape} material={m.steel} castShadow receiveShadow />
          <mesh geometry={geo.pinion} material={m.steel} scale={[0.7, 0.7, 1]} />
          <mesh geometry={geo.arbor} material={m.steel} />
        </group>
      </group>

      <group ref={setGroup("pallet")}>
        <group ref={setSpin("pallet")} rotation={[0, 0, 0.06]}>
          <mesh geometry={geo.pallet} material={m.blackPolish} castShadow receiveShadow />
          <mesh geometry={geo.palletStone} material={m.ruby} position={[2.05, 1.32, 0.2]} rotation={[0, 0, 0.5]} />
          <mesh geometry={geo.palletStone} material={m.ruby} position={[2.1, -1.28, 0.2]} rotation={[0, 0, -0.5]} />
          <mesh geometry={geo.arbor} material={m.steel} scale={[0.8, 0.8, 0.9]} />
        </group>
      </group>

      {/* bridges, each carrying its jewels */}
      {(["barrelBridge", "trainBridge", "remBridge", "palletBridge", "cock"] as const).map((id) => (
        <group key={id} ref={setGroup(id)}>
          <mesh geometry={geo[id]} material={bridgeMats} castShadow receiveShadow />
          <Jewels id={id} geo={geo} m={m} />
        </group>
      ))}

      {/* 11 balance */}
      <group ref={setGroup("balance")}>
        <group ref={setSpin("balance")}>
          <mesh geometry={geo.balance} material={m.glucydur} castShadow receiveShadow />
          {[0.25, 0.75, 1.25, 1.75].map((a) => (
            <mesh
              key={a}
              geometry={geo.balanceScrew}
              material={m.gold}
              position={[Math.cos(a * Math.PI) * 4.55, Math.sin(a * Math.PI) * 4.55, 0.17]}
              rotation={[0, 0, a * Math.PI - Math.PI / 2]}
            />
          ))}
          <mesh geometry={geo.staff} material={m.steel} />
          <mesh geometry={geo.roller} material={m.blackPolish} position={[0, 0, -0.5]} />
          <mesh ref={setSpin("hairspring")} geometry={geo.hairspring} material={m.blued} />
        </group>
      </group>

      {/* 08 remontoir: spring, detent, stop star */}
      <group ref={setGroup("remSpring")}>
        <mesh ref={setSpin("remSpring")} geometry={geo.remSpring} material={m.blued} castShadow />
      </group>
      <group ref={setGroup("remDetent")}>
        <group rotation={[0, 0, Math.atan2(P.rem[1] - -3.9, P.rem[0] - 11.9)]}>
          <mesh ref={setSpin("remDetent")} geometry={geo.remDetent} material={m.blackPolish} castShadow />
        </group>
      </group>
      <group ref={setGroup("remStar")}>
        <mesh ref={setSpin("remStar")} geometry={geo.remStar} material={m.blackPolish} castShadow receiveShadow />
      </group>

      <group ref={setGroup("crownWheel")}>
        <mesh geometry={geo.crownWheel} material={[m.steel, m.steel]} castShadow />
      </group>
      <group ref={setGroup("ratchet")}>
        <mesh geometry={geo.ratchet} material={[m.sunburstSteel, m.steel]} castShadow receiveShadow />
      </group>

      <instancedMesh ref={heads} args={[geo.screwHead, m.blued, SCREWS.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={slots} args={[geo.screwSlot, m.lacquer, SCREWS.length]} frustumCulled={false} />
    </group>
  );
}
