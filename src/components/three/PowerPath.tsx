"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { PART, POWER_PATH } from "./layout";
import { partObjects } from "./Movement";
import { sceneProgress, story } from "@/lib/story";
import { deadBeat, win } from "@/lib/math";

/**
 * The path energy takes through the exploded stack, barrel to balance.
 * Drawn once the last part is off, retracted before the remontoir is lifted
 * out. A ruby bead steps one wheel along it per second.
 */

const RUBY = new THREE.Color("#c8183a");
const SAMPLES = 220;

export function PowerPath() {
  const size = useThree((s) => s.size);
  const group = useRef<THREE.Group>(null);
  const bead = useRef<THREE.Mesh>(null);
  const nodes = useRef<THREE.InstancedMesh>(null);

  const { line, nodePoints } = useMemo(() => {
    // node = the wheel's arbor, a little above its plane, in movement coordinates
    const nodePoints = POWER_PATH.map((id) => {
      const ex = PART[id].ex;
      return new THREE.Vector3(ex[0], ex[1], ex[2] + 0.5);
    });
    const curve = new THREE.CatmullRomCurve3(nodePoints, false, "centripetal", 0.5);
    const pts = curve.getPoints(SAMPLES);
    const geometry = new LineGeometry();
    geometry.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]));
    const material = new LineMaterial({
      color: RUBY,
      linewidth: 1.4,
      transparent: true,
      opacity: 0.95,
      toneMapped: false,
      depthWrite: false,
    });
    const line = new Line2(geometry, material);
    line.computeLineDistances();
    line.frustumCulled = false;
    line.renderOrder = 4;
    return { line, nodePoints };
  }, []);

  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );

  useEffect(() => {
    const n = nodes.current;
    if (!n) return;
    const m = new THREE.Matrix4();
    nodePoints.forEach((p, i) => n.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    n.instanceMatrix.needsUpdate = true;
  }, [nodePoints]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const pA = sceneProgress("apart");
    const pO = sceneProgress("once");
    // drawn before its caption arrives (0.86), held to the end of the scene
    const reveal = win(pA, 0.76, 0.86) * (1 - win(pO, 0.0, 0.08));
    const visible = reveal > 0.001;
    g.visible = visible;
    if (!visible) return;

    // follow the movement root (it carries the flip and tilt)
    const root = partObjects.get("movement");
    if (root) {
      root.updateWorldMatrix(true, false);
      g.matrix.copy(root.matrixWorld);
      g.matrixWorldNeedsUpdate = true;
    }

    line.material.resolution.set(size.width, size.height);
    const segs = SAMPLES;
    line.geometry.instanceCount = Math.max(1, Math.round(segs * reveal));

    const n = nodes.current;
    if (n) n.count = Math.min(nodePoints.length, Math.floor(reveal * (nodePoints.length - 1) + 1.0001));

    // the bead steps one wheel per real second, and rests at the balance
    const b = bead.current;
    if (b) {
      const t = Date.now() / 1000;
      const whole = Math.floor(t);
      const k = whole % nodePoints.length;
      const last = k === nodePoints.length - 1;
      const a = nodePoints[k];
      const c = nodePoints[last ? k : k + 1];
      const step = story.reduced ? 1 : deadBeat(t - whole, 0.14);
      b.position.lerpVectors(a, c, last ? 0 : step);
      b.visible = reveal > 0.98;
    }
  });

  return (
    <group ref={group} matrixAutoUpdate={false}>
      <primitive object={line} />
      <instancedMesh ref={nodes} args={[undefined, undefined, POWER_PATH.length]} renderOrder={5} frustumCulled={false}>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshBasicMaterial color={RUBY} toneMapped={false} />
      </instancedMesh>
      <mesh ref={bead} renderOrder={6}>
        <sphereGeometry args={[0.85, 24, 16]} />
        <meshBasicMaterial color="#ff2d55" toneMapped={false} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
