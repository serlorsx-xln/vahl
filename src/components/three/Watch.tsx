"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Materials } from "./materials";
import * as G from "./geometry";
import { Movement } from "./Movement";
import { sceneProgress, story } from "@/lib/story";
import { damp, deadBeat, easeInOutCubic, lerp, smoothstep, win } from "@/lib/math";
import { tromsoClock } from "@/lib/time";

export const watchState = {
  /** 1 when the dial faces the viewer */
  dialUp: 1,
};

const DIAL_R = 15.7;
const INK = "#15161a";

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, cx + widths[i] / 2, y);
    cx += widths[i] + spacing;
  });
}

/** The dial print: minute track, step numerals, name — black lacquer on frost */
function useDialPrint() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 2048;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const family = getComputedStyle(document.body).fontFamily || "sans-serif";
    const draw = () => {
      if (cancelled) return;
      const c = tex.image as HTMLCanvasElement;
      const ctx = c.getContext("2d")!;
      const S = c.width;
      const R = S / 2;
      ctx.clearRect(0, 0, S, S);
      ctx.save();
      ctx.translate(R, R);
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      const k = R / DIAL_R; // px per mm

      // minute / seconds track: 60 steps, the unit this watch counts in
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const five = i % 5 === 0;
        const r0 = (five ? 13.95 : 14.25) * k;
        const r1 = 14.95 * k;
        ctx.lineWidth = (five ? 0.16 : 0.08) * k;
        ctx.beginPath();
        ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0);
        ctx.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1);
        ctx.stroke();
      }
      ctx.lineWidth = 0.05 * k;
      ctx.beginPath();
      ctx.arc(0, 0, 14.95 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 14.25 * k, 0, Math.PI * 2);
      ctx.stroke();

      // step numerals every ten seconds
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `500 ${0.92 * k}px ${family}`;
      for (let i = 10; i <= 60; i += 10) {
        const a = (i / 60) * Math.PI * 2;
        const r = 13.05 * k;
        ctx.save();
        ctx.translate(Math.sin(a) * r, -Math.cos(a) * r);
        ctx.fillText(String(i), 0, 0);
        ctx.restore();
      }

      // name
      ctx.font = `600 ${1.55 * k}px ${family}`;
      try {
        (ctx as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "expanded";
      } catch {}
      drawSpaced(ctx, "VAHL", 0, -5.6 * k, 0.55 * k);
      ctx.font = `500 ${0.62 * k}px ${family}`;
      drawSpaced(ctx, "TROMSØ", 0, -3.85 * k, 0.32 * k);
      ctx.font = `500 ${0.7 * k}px ${family}`;
      drawSpaced(ctx, "MØRKETID", 0, 5.2 * k, 0.36 * k);
      ctx.font = `400 ${0.5 * k}px ${family}`;
      drawSpaced(ctx, "SECONDE MORTE", 0, 6.35 * k, 0.26 * k);
      ctx.restore();
      tex.needsUpdate = true;
    };
    draw();
    document.fonts?.load(`600 40px ${family}`).then(draw).catch(() => {});
    document.fonts?.ready.then(draw).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tex]);

  return tex;
}

/** Crown: fluted barrel, bevelled shoulder, slightly domed end, along x */
function crownGeometry() {
  const pts: THREE.Vector2[] = [];
  const prof: [number, number][] = [
    [0, 1.42],
    [1.2, 1.4],
    [2.1, 1.33],
    [2.62, 1.18],
    [2.86, 0.95],
    [2.9, 0.7],
    [2.9, -0.8],
    [2.78, -1.1],
    [2.4, -1.25],
    [1.3, -1.25],
  ];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 96);
  // flutes: push the barrel's vertices in and out around the axis
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r > 2.85 && Math.abs(v.y) < 0.75) {
      const a = Math.atan2(v.z, v.x);
      const k = 1 - 0.035 * (0.5 + 0.5 * Math.cos(a * 24));
      pos.setXYZ(i, v.x * k, v.y, v.z * k);
    }
  }
  g.computeVertexNormals();
  // lathe axis is +y; the crown points out along -x
  return g.rotateZ(Math.PI / 2);
}

export function Watch({ materials: m }: { materials: Materials }) {
  const flip = useRef<THREE.Group>(null);
  const caseGroup = useRef<THREE.Group>(null);
  const hourHand = useRef<THREE.Mesh>(null);
  const minuteHand = useRef<THREE.Mesh>(null);
  const secondHand = useRef<THREE.Mesh>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const print = useDialPrint();

  const geo = useMemo(() => {
    const hour = G.extrude(G.leafHandShape(9.0, 1.55, 1.7), 0.13, 0.02, 24);
    const minute = G.extrude(G.leafHandShape(13.3, 1.25, 2.0), 0.12, 0.02, 24);
    const second = G.extrude(G.secondsHandShape(14.7, 3.8), 0.09, 0, 24);
    return {
      case: G.caseGeometry(),
      lug: G.extrude(G.lugShape(), 4.6, 0.45, 24),
      crown: crownGeometry(),
      crownNeck: new THREE.CylinderGeometry(1.15, 1.15, 1.6, 24).rotateZ(Math.PI / 2),
      crystal: new THREE.CylinderGeometry(16.3, 16.3, 0.5, 96).rotateX(Math.PI / 2),
      dial: new THREE.CircleGeometry(DIAL_R, 128),
      marker: new THREE.BoxGeometry(0.62, 2.1, 0.28),
      cannon: new THREE.CylinderGeometry(0.62, 0.62, 0.5, 24).rotateX(Math.PI / 2),
      hour,
      minute,
      second,
    };
  }, []);

  const markers = useMemo(() => {
    const list: { pos: [number, number, number]; rot: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 11.3;
      if (i === 0) {
        for (const off of [-0.55, 0.55]) {
          list.push({ pos: [off, r, 0], rot: 0 });
        }
        continue;
      }
      // dial is read from -z: mirror x so markers sit where the print expects them
      list.push({ pos: [-Math.sin(a) * r, Math.cos(a) * r, 0], rot: a });
    }
    return list;
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const pTurn = sceneProgress("turn");
    const pG = sceneProgress("again");
    const f = flip.current;
    const cg = caseGroup.current;
    if (!f || !cg) return;

    const toBridges = win(pTurn, 0.06, 0.6, easeInOutCubic);
    const toDial = win(pG, 0.64, 0.97, easeInOutCubic);
    const angle = Math.PI * (1 - toBridges) + Math.PI * toDial;
    const dialUp = 1 - toBridges + toDial;
    watchState.dialUp = dialUp;

    // lean into the light with the cursor while the dial faces up
    const w = story.pointer.fine && !story.reduced ? smoothstep(0.4, 1, dialUp) : 0;
    tilt.current.x = lerp(tilt.current.x, -story.pointer.ny * 0.07 * w, damp(3, dt));
    tilt.current.y = lerp(tilt.current.y, story.pointer.nx * 0.1 * w, damp(3, dt));

    const turning = Math.sin(toBridges * Math.PI) + Math.sin(toDial * Math.PI);
    f.rotation.set(tilt.current.x + turning * 0.18, angle + tilt.current.y, turning * 0.05);
    f.position.set(0, 0, turning * 5);

    // the case drops away beneath the movement, then slides out of frame
    const caseOut = win(pTurn, 0.42, 0.88, easeInOutCubic) * (1 - win(pG, 0.54, 0.8, easeInOutCubic));
    const drop = smoothstep(0, 0.45, caseOut);
    const slide = smoothstep(0.3, 1, caseOut);
    cg.position.set(slide * 85, -slide * 34, -drop * 16 - slide * 10);
    cg.rotation.set(slide * 0.4, -slide * 0.5, slide * 0.3);
    cg.visible = caseOut < 0.999;

    // Tromsø time; the seconds hand steps
    const { h, m: mm, s, ms } = tromsoClock();
    const TAU = Math.PI * 2;
    if (hourHand.current) hourHand.current.rotation.z = (((h % 12) + mm / 60 + s / 3600) / 12) * TAU;
    if (minuteHand.current) minuteHand.current.rotation.z = ((mm + s / 60) / 60) * TAU;
    if (secondHand.current) secondHand.current.rotation.z = ((s - 1 + deadBeat(ms / 1000)) / 60) * TAU;
  });

  return (
    <group ref={flip}>
      <Movement materials={m} />
      <group ref={caseGroup}>
        <mesh geometry={geo.case} material={m.caseSteel} castShadow receiveShadow />
        {[
          [12.1, 14.6, 0],
          [-12.1, 14.6, 0],
          [12.1, -14.6, Math.PI],
          [-12.1, -14.6, Math.PI],
        ].map(([x, y, r], i) => (
          <mesh
            key={i}
            geometry={geo.lug}
            material={[m.brushedSteel, m.caseSteel]}
            position={[x, y, -1.9]}
            rotation={[0, 0, r]}
            castShadow
          />
        ))}
        <mesh geometry={geo.crownNeck} material={m.caseSteel} position={[-20.2, 0, 0.9]} />
        <mesh geometry={geo.crown} material={m.caseSteel} position={[-22.0, 0, 0.9]} castShadow />
        <mesh geometry={geo.crystal} material={m.sapphire} position={[0, 0, -3.05]} renderOrder={2} />

        {/* dial, read from -z */}
        <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.6]}>
          <mesh geometry={geo.dial} material={m.dial} receiveShadow />
          <mesh geometry={geo.dial} position={[0, 0, 0.012]}>
            <meshStandardMaterial
              map={print}
              transparent
              alphaTest={0.25}
              metalness={0}
              roughness={0.42}
              color="#ffffff"
              polygonOffset
              polygonOffsetFactor={-2}
            />
          </mesh>
        </group>
        <group position={[0, 0, -0.6]}>
          {markers.map((mk, i) => (
            <mesh
              key={i}
              geometry={geo.marker}
              material={m.whiteGold}
              position={[mk.pos[0], mk.pos[1], -0.14]}
              rotation={[0, 0, mk.rot]}
              castShadow
            />
          ))}
        </group>
        <mesh ref={hourHand} geometry={geo.hour} material={m.blued} position={[0, 0, -1.3]} castShadow />
        <mesh ref={minuteHand} geometry={geo.minute} material={m.blued} position={[0, 0, -1.55]} castShadow />
        <mesh ref={secondHand} geometry={geo.second} material={m.blued} position={[0, 0, -1.78]} castShadow />
        <mesh geometry={geo.cannon} material={m.blued} position={[0, 0, -1.85]} />
      </group>
    </group>
  );
}
