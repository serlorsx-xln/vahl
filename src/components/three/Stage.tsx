"use client";

import { Component, useEffect, useMemo, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createMaterials } from "./materials";
import { Watch } from "./Watch";
import { Rig } from "./Rig";
import { Lights, PolishEnv } from "./Lights";
import { PowerPath } from "./PowerPath";
import { Labels } from "./Labels";
import { Pipeline } from "./Pipeline";
import { story } from "@/lib/story";

function Scene() {
  const materials = useMemo(() => createMaterials(), []);
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => {
        if (m instanceof THREE.Material) m.dispose();
      });
    },
    [materials],
  );
  return (
    <>
      <Lights />
      <PolishEnv material={materials.blackPolish} />
      <Watch materials={materials} />
      <PowerPath />
      <Rig />
      <Labels />
      <Pipeline />
      <Ready />
    </>
  );
}

/** Flags the first rendered frames so the page can bring the watch in */
function Ready() {
  useFrame((state) => {
    if (story.canvasReady || state.clock.elapsedTime < 0.35) return;
    story.canvasReady = true;
    document.documentElement.classList.add("gl-ready");
  });
  return null;
}

class GLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    document.documentElement.classList.add("gl-failed");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Stage() {
  const dpr: [number, number] = story.mobile ? [1, 1.5] : [1, 1.75];
  return (
    <GLBoundary>
      <Canvas
        className="gl"
        dpr={dpr}
        shadows="percentage"
        gl={{
          antialias: true,
          alpha: true,
          stencil: false,
          powerPreference: "high-performance",
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.0,
        }}
        camera={{ fov: 30, near: 2, far: 1400, position: [0, -40, 90] }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        aria-hidden="true"
        tabIndex={-1}
      >
        <Scene />
      </Canvas>
    </GLBoundary>
  );
}
