"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { sceneProgress, story } from "@/lib/story";
import { lerp, smoothstep } from "@/lib/math";

/**
 * A watchmaker's bench, lit for inspection: an overhead softbox, two long
 * strips that run along the anglage, a ring like a loupe lamp, the frosted
 * bench below. At mørketid the room goes down to one warm lamp.
 */

const DAY_KEY = new THREE.Color("#fff8ee");
// one lamp at night, barely warm: the steel and the cream dial stay themselves
const NIGHT_KEY = new THREE.Color("#fff0e0");

/**
 * Black polish is a flawless mirror that reads black only because it faces a
 * dark room. It gets a room of its own: black, with the bench's light strips
 * and one narrow strip behind, so as the star turns, or the camera circles
 * it, its faces flash white and go black again.
 */
export function PolishEnv({ material }: { material: THREE.MeshStandardMaterial }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new THREE.Scene();
    room.background = new THREE.Color("#050506");
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const strip = (w: number, h: number, pos: [number, number, number], intensity: number) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.lookAt(0, 0, 0);
      room.add(mesh);
      geos.push(geo);
      mats.push(mat);
    };
    strip(220, 5, [-90, 10, 34], 6);
    strip(220, 3, [85, -30, 26], 4);
    strip(5, 140, [0, 87, 96], 6);
    strip(60, 8, [-58, 46, 92], 3);
    const rt = pmrem.fromScene(room, 0, 1, 1000);
    material.envMap = rt.texture;
    material.envMapIntensity = 1;
    material.needsUpdate = true;
    return () => {
      material.envMap = null;
      rt.dispose();
      pmrem.dispose();
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    };
  }, [gl, material]);
  return null;
}

export function Lights() {
  const scene = useThree((s) => s.scene);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);
  const shadowMat = useRef<THREE.ShadowMaterial>(null);

  useFrame(() => {
    const night = smoothstep(0.08, 0.6, sceneProgress("night"));
    scene.environmentIntensity = lerp(1, 0.5, night);
    const k = key.current;
    if (k) {
      k.intensity = lerp(1.5, 1.45, night);
      k.color.copy(DAY_KEY).lerp(NIGHT_KEY, night);
      k.position.set(lerp(-34, -20, night), lerp(46, 30, night), 120);
    }
    if (fill.current) fill.current.intensity = lerp(0.35, 0.14, night);
    // the exploded stack throws long, broken shadows; keep them faint
    const apart = sceneProgress("apart") * (1 - sceneProgress("again"));
    if (shadowMat.current) shadowMat.current.opacity = lerp(lerp(0.17, 0.07, apart), 0.42, night);
  });

  const mapSize = story.mobile ? 1024 : 2048;

  return (
    <>
      <Environment resolution={256} frames={1}>
        {/* the room: warm grey walls, so a mirror polish reflects something */}
        <mesh scale={600}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#5f5c57" side={THREE.BackSide} />
        </mesh>
        {/* softbox, up and to the left, off the lens axis */}
        <Lightformer form="rect" intensity={2.6} color="#fffaf2" scale={[90, 50, 1]} position={[-58, 46, 92]} target={[0, 0, 0]} />
        {/* long strips: these are what flash along a bevel */}
        <Lightformer form="rect" intensity={5} color="#ffffff" scale={[220, 5, 1]} position={[-90, 10, 34]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#f2f4ff" scale={[220, 3, 1]} position={[85, -30, 26]} target={[0, 0, 0]} />
        {/* ring lamp around the loupe */}
        <Lightformer form="ring" intensity={1.6} color="#ffffff" scale={22} position={[34, -40, 92]} target={[0, 0, 0]} />
        {/* the room, dim and warm */}
        <Lightformer form="rect" intensity={0.5} color="#e9e2d6" scale={[400, 400, 1]} position={[0, 160, 0]} target={[0, 0, 0]} />
        {/* the frosted bench below */}
        <Lightformer form="rect" intensity={0.7} color="#d8d5ce" scale={[400, 400, 1]} position={[0, 0, -90]} target={[0, 0, 0]} />
      </Environment>

      <hemisphereLight ref={fill} args={["#f4f1ea", "#7d786f", 0.35]} position={[0, 0, 1]} />
      <directionalLight
        ref={key}
        position={[-34, 46, 120]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-62}
        shadow-camera-right={62}
        shadow-camera-top={62}
        shadow-camera-bottom={-62}
        shadow-camera-near={10}
        shadow-camera-far={320}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-radius={3}
      />

      {/* the bench: takes shadows only, the frost ground is the page itself */}
      <mesh position={[0, 0, -7.4]} receiveShadow renderOrder={-1}>
        <planeGeometry args={[900, 900]} />
        <shadowMaterial ref={shadowMat} transparent opacity={0.17} depthWrite={false} />
      </mesh>
    </>
  );
}
