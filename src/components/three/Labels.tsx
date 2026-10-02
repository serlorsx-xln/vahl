"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LABELLED, SCREWS } from "./layout";
import { movementState, partObjects } from "./Movement";
import { sceneProgress, story } from "@/lib/story";
import { damp, lerp, smoothstep } from "@/lib/math";

/**
 * Projects the labelled parts to the screen and lays their specimen tags out
 * in one column beside the stack, the way an exploded drawing is annotated:
 * hairline leaders, no tag overlapping another.
 */

/** distance from a part's arbor to the edge the leader touches, mm */
const EDGE: Record<string, number> = {
  plate: 15.6,
  barrel: 5.6,
  ratchet: 3.8,
  barrelBridge: 4.6,
  trainBridge: 7.2,
  escape: 2.1,
  pallet: 2.2,
  balance: 4.3,
  cock: 2.6,
  remStar: 1.8,
  screws: 0.5,
};

const TAG_H = 58;
const GAP = 10;

export function Labels() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const tmp = useMemo(
    () => ({ v: new THREE.Vector3(), right: new THREE.Vector3(), screw: new THREE.Vector3() }),
    [],
  );
  const state = useRef(new Map<string, { y: number; o: number }>());
  // tag heights are static content: measure once per viewport size, with and
  // without the detail line, which drops out when the column runs short
  const heights = useRef({ w: 0, compact: false, map: new Map<string, { full: number; detail: number }>() });

  // the screw the leader points at: the one furthest to the right on the ring
  const screwIndex = useMemo(() => {
    let best = 0;
    SCREWS.forEach((s, i) => {
      if (s.ex[0] - s.ex[1] * 0.3 > SCREWS[best].ex[0] - SCREWS[best].ex[1] * 0.3) best = i;
    });
    return best;
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const pA = sceneProgress("apart");
    const pO = sceneProgress("once");
    const gate = story.mobile ? 0 : smoothstep(0.02, 0.06, pA) * (1 - smoothstep(0.0, 0.05, pO));
    const W = size.width;
    const H = size.height;
    tmp.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();

    const hc = heights.current;
    const column = story.labels.get(LABELLED[0])?.parentElement;
    if (hc.w !== W) {
      hc.w = W;
      hc.map.clear();
      column?.classList.remove("is-compact");
      hc.compact = false;
      for (const id of LABELLED) {
        const el = story.labels.get(id);
        const detail = el?.querySelector<HTMLElement>(".tag-detail");
        hc.map.set(id, { full: el?.offsetHeight || TAG_H, detail: detail ? detail.offsetHeight + 2 : 0 });
      }
    }
    const hOf = (id: string) => {
      const h = hc.map.get(id);
      return h ? h.full : TAG_H;
    };

    type Item = { id: string; sx: number; sy: number; o: number; ty: number; h: number };
    const items: Item[] = [];
    const root = partObjects.get("movement");

    for (const id of LABELLED) {
      const el = story.labels.get(id);
      const leader = story.leaders.get(id);
      if (!el || !leader) continue;
      const x = movementState.explode[id] ?? 0;
      // the remontoir keeps its tag while it is lifted out and demonstrated
      const g =
        id === "remStar" && !story.mobile
          ? Math.max(gate, smoothstep(0.24, 0.32, pO) * (1 - smoothstep(0.76, 0.82, pO)))
          : gate;
      const want = g * smoothstep(0.82, 1, x);
      const st = state.current.get(id) ?? { y: -1, o: 0 };
      st.o = story.reduced ? want : lerp(st.o, want, damp(want > st.o ? 7 : 12, dt));
      state.current.set(id, st);
      if (st.o < 0.004) {
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        leader.line.style.opacity = "0";
        leader.dot.style.opacity = "0";
        continue;
      }
      if (id === "screws") {
        if (!root) continue;
        const sc = SCREWS[screwIndex];
        const t = Math.pow(x, 1.6);
        tmp.v.set(
          lerp(sc.home[0], sc.ex[0], t),
          lerp(sc.home[1], sc.ex[1], t),
          lerp(sc.home[2], sc.ex[2], x),
        );
        root.localToWorld(tmp.v);
      } else {
        const obj = partObjects.get(id);
        if (!obj) continue;
        obj.getWorldPosition(tmp.v);
      }
      tmp.v.addScaledVector(tmp.right, EDGE[id] ?? 1);
      tmp.v.project(camera);
      if (tmp.v.z > 1) continue;
      const sx = ((tmp.v.x + 1) / 2) * W;
      const sy = ((1 - tmp.v.y) / 2) * H;
      items.push({ id, sx, sy, o: st.o, ty: sy - 10, h: hOf(id) });
    }

    // one column, right of the stack; de-overlap top-down, then bottom-up
    items.sort((a, b) => a.ty - b.ty);
    const top = H * 0.11;
    const bottom = H - 40;
    const need = items.reduce((n, it) => n + it.h + GAP, -GAP);
    const compact = need > bottom - top;
    if (compact !== hc.compact) {
      hc.compact = compact;
      column?.classList.toggle("is-compact", compact);
    }
    if (compact) for (const it of items) it.h -= hc.map.get(it.id)?.detail ?? 0;
    for (let i = 0; i < items.length; i++) {
      const prev = items[i - 1];
      const min = prev ? prev.ty + prev.h + GAP : top;
      items[i].ty = Math.max(items[i].ty, min);
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const next = items[i + 1];
      const max = next ? next.ty - items[i].h - GAP : bottom - items[i].h;
      items[i].ty = Math.min(items[i].ty, max);
    }

    const colX = Math.round(Math.min(W - 330, W * 0.725));
    for (const it of items) {
      const el = story.labels.get(it.id)!;
      const leader = story.leaders.get(it.id)!;
      const st = state.current.get(it.id)!;
      st.y = st.y < 0 || story.reduced ? it.ty : lerp(st.y, it.ty, damp(10, dt));
      const y = Math.round(st.y);
      el.style.visibility = "visible";
      el.style.opacity = it.o.toFixed(3);
      el.style.transform = `translate3d(${colX}px, ${y}px, 0)`;
      const ex = colX - 14;
      const ey = y + 9;
      // leader: from the part's edge out to the tag, with a short horizontal shoulder
      leader.line.setAttribute("x1", it.sx.toFixed(1));
      leader.line.setAttribute("y1", it.sy.toFixed(1));
      leader.line.setAttribute("x2", ex.toFixed(1));
      leader.line.setAttribute("y2", ey.toFixed(1));
      leader.line.style.opacity = (it.o * 0.9).toFixed(3);
      leader.dot.setAttribute("cx", it.sx.toFixed(1));
      leader.dot.setAttribute("cy", it.sy.toFixed(1));
      leader.dot.style.opacity = it.o.toFixed(3);
    }
  });

  return null;
}
